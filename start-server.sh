#!/bin/bash
cd "$(dirname "$0")" && \
AGENTHARNESS_SERVER_URL=ws://localhost:8080/ws \
JWT_SECRET="your-super-secret-jwt-secret-change-me-in-production" \
DATABASE_URL="postgres://agentharness:agentharness@localhost:5432/agentharness?sslmode=disable" \
./server/bin/server
