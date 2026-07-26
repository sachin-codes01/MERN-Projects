// Indian mobile numbers are 10 digits starting 6-9. Everything else (0 or
// 91 prefixes, spaces, dashes, brackets) is stripped first so a visitor can
// paste "+91 98765 43210" or "098765-43210" and still pass.
//
// Kept in its own module rather than beside the contact form so the rule
// has one definition on the client — the server mirrors it in
// controller/enquiryController.js + models/Enquiry.js.
export function normalisePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export const isValidIndianMobile = (raw) => /^[6-9]\d{9}$/.test(normalisePhone(raw));
