"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Save, Key } from "lucide-react";
import { Input } from "@agentharness/ui/components/ui/input";
import { Label } from "@agentharness/ui/components/ui/label";
import { Button } from "@agentharness/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@agentharness/ui/components/ui/card";
import { toast } from "sonner";
import { useAuthStore } from "@agentharness/core/auth";
import { api } from "@agentharness/core/api";
import { useFileUpload } from "@agentharness/core/hooks/use-file-upload";
import { useTranslation } from "@agentharness/core";

export function AccountTab() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const { upload, uploading } = useFileUpload(api);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    setProfileName(user?.name ?? "");
  }, [user]);

  const initials = (user?.name ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = "";
    try {
      const result = await upload(file);
      if (!result) return;
      const updated = await api.updateMe({ avatar_url: result.link });
      setUser(updated);
      toast.success(t("settings.account.avatarUpdated", "Avatar updated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.account.failedToUploadAvatar", "Failed to upload avatar"));
    }
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      const updated = await api.updateMe({ name: profileName });
      setUser(updated);
      toast.success(t("settings.account.profileUpdated", "Profile updated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("settings.account.failedToUpdateProfile", "Failed to update profile"));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error(t("settings.account.passwordRequired"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.account.passwordMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t("settings.account.passwordTooShort"));
      return;
    }
    setPasswordSaving(true);
    try {
      // If user has no password, use setPassword; otherwise use changePassword
      if (!user?.has_password) {
        await api.setPassword(newPassword);
        toast.success(t("settings.account.passwordSetSuccess"));
      } else {
        await api.changePassword(currentPassword, newPassword);
        toast.success(t("settings.account.passwordChangedSuccess"));
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      // Refresh user data
      const updated = await api.getMe();
      setUser(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("settings.account.passwordUpdateFailed"));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">{t("settings.account.title", "Profile")}</h2>

        <Card>
          <CardContent className="space-y-4">
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="group relative h-16 w-16 shrink-0 rounded-full bg-muted overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                    {initials}
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <div className="text-xs text-muted-foreground">
                {t("settings.account.clickToUploadAvatar", "Click to upload avatar")}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">{t("common.name", "Name")}</Label>
              <Input
                type="search"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleProfileSave}
                disabled={profileSaving || !profileName.trim()}
              >
                <Save className="h-3 w-3" />
                {profileSaving ? t("settings.account.updating", "Updating...") : t("settings.account.updateProfile", "Update Profile")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">{t("settings.account.security")}</h2>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4" />
              {user?.has_password ? t("settings.account.changePassword") : t("settings.account.setPassword")}
            </CardTitle>
            <CardDescription>
              {user?.has_password ? t("settings.account.changePasswordDescription") : t("settings.account.setPasswordDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                {user?.has_password ? t("settings.account.changePassword") : t("settings.account.setPassword")}
              </Button>
            ) : (
              <div className="space-y-4">
                {user?.has_password && (
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{t("settings.account.currentPassword")}</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-password">{user?.has_password ? t("settings.account.newPassword") : t("settings.account.password")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("settings.account.confirmPassword")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={passwordSaving || !newPassword || !confirmPassword || (user?.has_password && !currentPassword)}
                  >
                    {passwordSaving ? t("settings.account.saving") : user?.has_password ? t("settings.account.changePassword") : t("settings.account.setPassword")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    {t("settings.account.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
