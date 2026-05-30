"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/storage";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { WelcomeGuide } from "@/components/onboarding/WelcomeGuide";

type Screen = "loading" | "guide" | "onboarding" | "done";

const GUIDE_KEY = "et_guide_seen";

export default function RootPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("loading");

  useEffect(() => {
    const profile = getProfile();
    if (profile?.onboarding_complete) {
      router.replace("/dashboard");
      return;
    }
    const guideSeen = localStorage.getItem(GUIDE_KEY);
    setScreen(guideSeen ? "onboarding" : "guide");
  }, [router]);

  if (screen === "loading") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3"
        style={{ background: "var(--bg-primary)" }}>
        <div className="text-5xl animate-bounce">💰</div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          Expense Tracker
        </p>
      </div>
    );
  }

  if (screen === "guide") {
    return (
      <WelcomeGuide
        onDone={() => {
          localStorage.setItem(GUIDE_KEY, "1");
          setScreen("onboarding");
        }}
      />
    );
  }

  return <Onboarding onComplete={() => router.replace("/dashboard")} />;
}
