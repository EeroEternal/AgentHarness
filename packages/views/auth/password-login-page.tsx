"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@agentharness/ui/components/ui/card";
import { Input } from "@agentharness/ui/components/ui/input";
import { Button } from "@agentharness/ui/components/ui/button";
import { Label } from "@agentharness/ui/components/ui/label";
import { useAuthStore } from "@agentharness/core/auth";
import { useWorkspaceStore } from "@agentharness/core/workspace";
import { api } from "@agentharness/core/api";

interface PasswordLoginPageProps {
  logo?: React.ReactNode;
  onSuccess: () => void;
  onForceChangePassword: () => void;
  lastWorkspaceId?: string | null;
  onTokenObtained?: () => void;
}

export function PasswordLoginPage({
  logo,
  onSuccess,
  onForceChangePassword,
  lastWorkspaceId,
  onTokenObtained,
}: PasswordLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) {
        setError("Email and password are required");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const user = await useAuthStore.getState().loginWithPassword(email, password);
        if (user.password_change_required) {
          onTokenObtained?.();
          onForceChangePassword();
        } else {
          const wsList = await api.listWorkspaces();
          useWorkspaceStore.getState().hydrateWorkspace(wsList, lastWorkspaceId);
          onTokenObtained?.();
          onSuccess();
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Invalid email or password"
        );
        setLoading(false);
      }
    },
    [email, password, onSuccess, onForceChangePassword, lastWorkspaceId, onTokenObtained]
  );

  return (
    <div className="flex min-h-svh items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          {logo && <div className="mx-auto mb-4">{logo}</div>}
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Sign in with your email and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!email || !password || loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Sign up
            </a>
          </div>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => window.location.href = "/login-magic"}
          >
            Continue with magic link
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
