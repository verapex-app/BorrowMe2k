import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function SubmissionPage() {
  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("id");

    if (!userId || Number.isNaN(Number(userId))) {
      setStatus("error");
      return;
    }

    fetch("/api/kyc/submitted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: Number(userId) }),
    })
      .then((r) => r.json())
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-5">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">Processing your submission…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Verification Submitted!</h1>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                We've received your identity verification. Our team will review it and update your account status within <span className="font-semibold text-foreground">24 hours</span>.
              </p>
            </div>
            <div className="bg-muted rounded-xl px-4 py-3 text-left text-sm text-muted-foreground leading-relaxed">
              You'll receive an email notification once your ID is reviewed. You can check your status in the app under <span className="font-medium text-foreground">Profile</span>.
            </div>
            <a
              href="/"
              className="block w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm"
            >
              Back to BorrowMe
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground text-sm mt-2">
                We couldn't record your submission. Please contact support or try again.
              </p>
            </div>
            <a
              href="/"
              className="block w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm"
            >
              Go to Homepage
            </a>
          </>
        )}
      </div>
    </div>
  );
}
