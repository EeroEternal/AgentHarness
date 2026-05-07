#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR=${APP_DIR:-$(pwd)}
RELEASE_DIR=${RELEASE_DIR:-}
ENV_FILE=${ENV_FILE:-.env.production}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.deploy.yml}
APP_PORT=${APP_PORT:-9997}
APP_VERSION=${APP_VERSION:-0.2.2}
GIT_COMMIT=${GIT_COMMIT:-unknown}
DOCKER_REGISTRY_MIRROR=${DOCKER_REGISTRY_MIRROR:-https://mirror.ccs.tencentyun.com}

log() {
  printf '[deploy] %s\n' "$*"
}

docker_cmd() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  else
    sudo docker "$@"
  fi
}

compose_cmd() {
  if docker info >/dev/null 2>&1; then
    if docker compose version >/dev/null 2>&1; then
      docker compose "$@"
      return
    fi
  else
    if sudo docker compose version >/dev/null 2>&1; then
      sudo docker compose "$@"
      return
    fi
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    sudo docker-compose "$@"
  fi
}

set_or_append() {
  local key=$1
  local value=$2

  if grep -q "^${key}=" "$ENV_FILE"; then
    python3 - "$ENV_FILE" "$key" "$value" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
key = sys.argv[2]
value = sys.argv[3]
lines = path.read_text().splitlines()
for index, line in enumerate(lines):
    if line.startswith(f"{key}="):
        lines[index] = f"{key}={value}"
        break
path.write_text("\n".join(lines) + "\n")
PY
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

ensure_docker() {
  export DEBIAN_FRONTEND=noninteractive
  export NEEDRESTART_MODE=a

  if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
      if docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1; then
        return
      fi
    elif sudo docker info >/dev/null 2>&1; then
      if sudo docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || sudo docker-compose version >/dev/null 2>&1; then
        return
      fi
    fi
  fi

  log "Installing Docker from Ubuntu apt repositories"
  sudo rm -f /etc/apt/sources.list.d/docker.list /etc/apt/keyrings/docker.asc || true
  sudo apt-get update
  if sudo apt-get install -y docker.io docker-compose-v2; then
    :
  elif sudo apt-get install -y docker.io docker-compose-plugin; then
    :
  else
    sudo apt-get install -y docker.io docker-compose
  fi
  sudo systemctl enable --now docker || true
  sudo usermod -aG docker "$USER" || true
}

configure_docker_daemon() {
  log "Configuring Docker registry mirror ${DOCKER_REGISTRY_MIRROR}"
  sudo mkdir -p /etc/docker
  sudo python3 - "$DOCKER_REGISTRY_MIRROR" <<'PY'
import json
from pathlib import Path
import sys

mirror = sys.argv[1]
path = Path('/etc/docker/daemon.json')
data = {}
if path.exists():
    try:
        data = json.loads(path.read_text() or '{}')
    except json.JSONDecodeError:
        data = {}
mirrors = data.get('registry-mirrors', [])
if mirror not in mirrors:
    mirrors.insert(0, mirror)
data['registry-mirrors'] = mirrors
path.write_text(json.dumps(data, indent=2) + '\n')
PY
  sudo systemctl restart docker || true
}

ensure_runtime_tools() {
  if ! command -v curl >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y curl
  fi

  if ! command -v fuser >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y psmisc
  fi
}

ensure_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    log "Creating $ENV_FILE from template"
    cp .env.production.example "$ENV_FILE"
  fi

  if ! grep -q '^POSTGRES_PASSWORD=' "$ENV_FILE" || [ -z "$(sed -n 's/^POSTGRES_PASSWORD=//p' "$ENV_FILE")" ]; then
    set_or_append POSTGRES_PASSWORD "$(openssl rand -hex 24)"
  fi

  if ! grep -q '^JWT_SECRET=' "$ENV_FILE" || [ -z "$(sed -n 's/^JWT_SECRET=//p' "$ENV_FILE")" ]; then
    set_or_append JWT_SECRET "$(openssl rand -hex 32)"
  fi

  if ! grep -q '^FRONTEND_ORIGIN=' "$ENV_FILE" || [ -z "$(sed -n 's/^FRONTEND_ORIGIN=//p' "$ENV_FILE")" ]; then
    set_or_append FRONTEND_ORIGIN "http://127.0.0.1:${APP_PORT}"
  fi

  if ! grep -q '^AGENTHARNESS_APP_URL=' "$ENV_FILE" || [ -z "$(sed -n 's/^AGENTHARNESS_APP_URL=//p' "$ENV_FILE")" ]; then
    set_or_append AGENTHARNESS_APP_URL "http://127.0.0.1:${APP_PORT}"
  fi
}

promote_release_dir() {
  if [ -z "$RELEASE_DIR" ] || [ "$RELEASE_DIR" = "$APP_DIR" ]; then
    return
  fi

  log "Promoting release payload from $RELEASE_DIR to $APP_DIR"
  mkdir -p "$APP_DIR"
  find "$APP_DIR" -mindepth 1 -maxdepth 1 \
    ! -name '.env.production' \
    ! -name '.env.production.local' \
    -exec rm -rf {} +
  cp -a "$RELEASE_DIR"/. "$APP_DIR"/
}

stop_existing_listener() {
  local pids
  pids=$(sudo fuser -n tcp "$APP_PORT" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    log "Stopping existing listener(s) on 127.0.0.1:${APP_PORT}: $pids"
    sudo kill -9 $pids || true
  fi
}

deploy_stack() {
  export APP_PORT APP_VERSION GIT_COMMIT

  log "Stopping previous containers"
  compose_cmd --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down --remove-orphans || true

  stop_existing_listener

  log "Starting containers"
  compose_cmd --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build --remove-orphans
}

healthcheck() {
  local url="http://127.0.0.1:${APP_PORT}"
  local attempt

  for attempt in $(seq 1 30); do
    if curl --silent --fail "$url" >/dev/null; then
      log "Frontend is reachable at $url"
      return 0
    fi
    sleep 2
  done

  log "Deployment healthcheck failed"
  compose_cmd --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
  return 1
}

main() {
  promote_release_dir
  cd "$APP_DIR"
  ensure_docker
  configure_docker_daemon
  ensure_runtime_tools
  ensure_env_file
  deploy_stack
  healthcheck
}

main "$@"