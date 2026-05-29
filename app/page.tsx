"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/storage";
import { Onboarding } from "@/components/onboarding/Onboarding";

export default function RootPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const profile = getProfile();
    if (profile?.onboarding_complete) {
      router.replace("/dashboard");
    } else {
      setShowOnboarding(true);
    }
  }, [router]);

  if (showOnboarding === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-4xl animate-pulse">💰</div>
      </div>
    );
  }

  return <Onboarding onComplete={() => router.replace("/dashboard")} />;
}
