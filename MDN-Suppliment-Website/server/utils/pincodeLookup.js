// Pincode → city/state, India Post ki free API se (api.postalpincode.in).
// Server pe isliye: browser kisi third party ko call na kare, aur ek pincode
// baar-baar maange to cache se jawab mile.
//
// City = post offices me sabse zyada aane wala District ("Mumbai",
// "Ghaziabad", "Bangalore") — Block kai jagah "NA" ya chhota area hota hai.

const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 din
const MAX_CACHE = 5000;
const cache = new Map(); // pincode → { value, at }

// "Raigarh(MH)" → "Raigarh"; sirf letters/space/.'- bache (address rules jaisa)
const cleanPlace = (v = "") =>
  String(v)
    .replace(/\(.*?\)/g, "")
    .replace(/[^\p{L}\p{M} .'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const mostCommon = (list) => {
  const counts = new Map();
  list.filter(Boolean).forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
};

// { city, state } ya null (pincode nahi mila / API down). Kabhi throw nahi karta.
const lookupPincode = async (pincode) => {
  const hit = cache.get(pincode);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value;

  let value = null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal: AbortSignal.timeout(4000) });
    const [data] = await res.json();
    const offices = data?.Status === "Success" ? data.PostOffice || [] : [];
    if (offices.length) {
      const city = cleanPlace(mostCommon(offices.map((o) => o.District)));
      const state = cleanPlace(mostCommon(offices.map((o) => o.State)));
      if (city && state) value = { city, state };
    }
  } catch {
    // Timeout/network — cache nahi karte, agli baar dobara koshish
    return null;
  }

  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(pincode, { value, at: Date.now() });
  return value;
};

module.exports = { lookupPincode };
