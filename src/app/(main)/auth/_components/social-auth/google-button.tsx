"use client";

import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { siGoogle } from "simple-icons";
import { toast } from "sonner";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";
import { auth, googleProvider } from "@/lib/firebase-client";
import { cn } from "@/lib/utils";

const ALLOWED_EMAILS = ["automation@pickndropapp.com", "atul@pickndropapp.com"];

export function GoogleButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email ?? "";

      if (!ALLOWED_EMAILS.includes(email)) {
        await auth.signOut();
        toast.error("Access denied", {
          description: "This Google account is not authorised to access the admin panel.",
        });
        return;
      }

      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to create session");
      }

      router.push("/dashboard/default");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      className={cn(className)}
      onClick={handleGoogleSignIn}
      disabled={loading}
      {...props}
    >
      <SimpleIcon icon={siGoogle} className="size-4" />
      {loading ? "Signing in…" : "Continue with Google"}
    </Button>
  );
}
