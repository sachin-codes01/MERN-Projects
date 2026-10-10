import { useEffect, useState } from "react";
import { api } from "../api/api";

const PINCODE_RE = /^[1-9]\d{5}$/;
const IDLE = { status: "idle", pincode: "", available: false, area: "", city: "", state: "" };

// Pincode pura (6 sahi digits) hote hi thoda ruk ke server se poochta hai:
//   available — admin ki delivery list me hai?
//   city/state — auto-fill ke liye
// status: idle | checking | done | error
export const usePincodeDetails = (rawPincode, token) => {
  const pincode = String(rawPincode || "").trim();
  const valid = PINCODE_RE.test(pincode);
  const [details, setDetails] = useState(IDLE);

  useEffect(() => {
    if (!valid) {
      setDetails(IDLE);
      return;
    }
    let cancelled = false;
    setDetails({ ...IDLE, status: "checking", pincode });
    const timer = setTimeout(() => {
      api
        .checkPincode(pincode, token)
        .then((d) => !cancelled && setDetails({ status: "done", ...d.data }))
        .catch(() => !cancelled && setDetails({ ...IDLE, status: "error", pincode }));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pincode, valid, token]);

  return details;
};
