import { useEffect, useRef, useState } from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { api } from "../api/api";

// Email field ke neeche chhota OTP box (channel prop phone ke liye bhi
// chalta hai, par phone OTP abhi band hai — SMS free nahi):
//   value sahi format ka ho → "Send OTP" button
//   code bheja → 6-digit input + Verify + resend timer
//   verify ho gaya (ya pehle se verified) → "Verified" badge
// Field ki value badalte hi sab reset — naya number = naya OTP.

const OtpVerify = ({ channel, target, valid, verified, testMode, token, onVerified }) => {
  const [step, setStep] = useState("idle"); // idle | sent
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef(null);
  const label = channel === "phone" ? "mobile number" : "email";

  // Target badla → shuru se
  useEffect(() => {
    setStep("idle");
    setCode("");
    setError("");
    setResendIn(0);
  }, [target]);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  if (!valid) return null;

  if (verified) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-mdn-green">
        <CheckCircleRoundedIcon sx={{ fontSize: 14 }} aria-hidden="true" />
        {channel === "phone" ? "Mobile number verified" : "Email verified"}
      </p>
    );
  }

  const send = async () => {
    if (busy || resendIn > 0) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.sendOtp(token, channel, target);
      if (data.alreadyVerified) {
        onVerified(target);
        return;
      }
      setStep("sent");
      setCode("");
      setResendIn(data.resendIn || 30);
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (busy) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.verifyOtp(token, channel, target, code);
      onVerified(target);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const inputId = `otp-${channel}`;

  return (
    <div className="mt-2 rounded-lg border border-mdn-border bg-mdn-charcoal2/50 p-3">
      {step === "idle" ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-mdn-gray">Verify your {label} to place the order.</span>
          <button
            type="button"
            onClick={send}
            disabled={busy}
            className="btn-primary !min-h-[36px] !px-4 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sending..." : "Send OTP"}
          </button>
        </div>
      ) : (
        <>
          <label htmlFor={inputId} className="block text-xs text-mdn-gray">
            Enter the 6-digit code sent to <span className="font-semibold text-mdn-ink">{target}</span>
          </label>
          <div className="mt-2 flex gap-2">
            <input
              ref={codeRef}
              id={inputId}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              onKeyDown={(e) => {
                // Enter se poora checkout form submit na ho — sirf verify
                if (e.key === "Enter") {
                  e.preventDefault();
                  verify();
                }
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              aria-invalid={!!error}
              aria-describedby={error ? `${inputId}-error` : undefined}
              className={`input-field flex-1 text-center font-mono tracking-[0.4em] ${error ? "!border-mdn-danger/60" : ""}`}
            />
            <button
              type="button"
              onClick={verify}
              disabled={busy || code.length !== 6}
              className="btn-primary !px-5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Checking..." : "Verify"}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={send}
              disabled={busy || resendIn > 0}
              className="font-semibold text-mdn-green hover:underline disabled:cursor-not-allowed disabled:text-mdn-gray disabled:no-underline"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
            {testMode && <span className="text-mdn-orange">Test mode: the code is printed in the server console</span>}
          </div>
        </>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs text-mdn-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default OtpVerify;
