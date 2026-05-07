import { LoginPage } from "@agentharness/views/auth";
import { AgentHarnessIcon } from "@agentharness/ui/components/common/agentharness-icon";

export function DesktopLoginPage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Traffic light inset */}
      <div
        className="h-[38px] shrink-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />
      <LoginPage
        logo={<AgentHarnessIcon bordered size="lg" />}
        onSuccess={() => {
          // Auth store update triggers AppContent re-render → shows DesktopShell
        }}
      />
    </div>
  );
}
