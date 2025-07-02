"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Wait until session state is known

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

  if (status === "loading") {
    return (
      <div style={{ textAlign: "center", paddingTop: "3rem" }}>
        <p>Redirecting to your dashboard...</p>
      </div>
    );
  }

  // No UI, just redirect logic
  return null;
}
