"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PartnerSignIn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "signing-in" | "error">(
    "loading",
  );

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      router.push("/login?error=invalid-partner-link");
      return;
    }

    // Verify the token is valid
    fetch("/api/auth/verify-partner-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        if (data.valid) {
          setStatus("signing-in");
          const result = await signIn("email", {
            email: email,
            redirect: false,
            callbackUrl: data.redirectUrl || "/app?welcome=partner",
          });

          if (result?.url) {
            router.push(data.redirectUrl || "/app?welcome=partner");
          } else {
            setStatus("error");
            router.push("/login?error=signin-failed");
          }
        } else {
          setStatus("error");
          router.push("/login?error=invalid-token");
        }
      })
      .catch(() => {
        setStatus("error");
        router.push("/login?error=system-error");
      });
  }, [token, email, router]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="text-center">
            {status === "loading" && (
              <>
                <h2 className="text-2xl font-bold text-gray-900">
                  Verifying your link...
                </h2>
                <p className="mt-2 text-gray-600">
                  Please wait while we set up your account.
                </p>
              </>
            )}

            {status === "signing-in" && (
              <>
                <h2 className="text-2xl font-bold text-gray-900">
                  Signing you in...
                </h2>
                <p className="mt-2 text-gray-600">
                  You&apos;ll be redirected to the app shortly.
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <h2 className="text-2xl font-bold text-red-600">
                  Something went wrong
                </h2>
                <p className="mt-2 text-gray-600">
                  Redirecting to login page...
                </p>
              </>
            )}

            <div className="mt-8">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
