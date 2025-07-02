"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated") {
      const role = session?.user?.role?.toLowerCase();

      const roleRoutes = {
        manager: "/manager/dashboard",
        accountant: "/accountant/dashboard",
        user: "/user/dashboard",
      };

      const destination = roleRoutes[role] || "/login";
      router.replace(destination);
    }
  }, [status, session, router]);

  // Optional loading screen to improve UX
  if (status === "loading") {
    return (
      <div style={{ textAlign: "center", paddingTop: "3rem" }}>
        <p>Redirecting to your dashboard...</p>
      </div>
    );
  }

  return null; // This component only handles routing logic
}
