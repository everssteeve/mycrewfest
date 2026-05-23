import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OfflineBanner } from "@/components/offline/offline-banner";
import { BottomNav, ScreenWrapper } from "@/components/ui";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div
      style={{
        backgroundColor: "var(--bg-darker)",
        minHeight: "100dvh",
      }}
    >
      <OfflineBanner />
      <ScreenWrapper>{children}</ScreenWrapper>
      <BottomNav />
    </div>
  );
}
