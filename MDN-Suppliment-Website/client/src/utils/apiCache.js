// localStorage-backed cache for public GET responses.
//
// The point is the SECOND visit: on a cold load every product row waits on
// a network round-trip before it can render anything but skeletons, and
// the API is on Render's free tier, where an idle instance cold-starts in
// tens of seconds. A cached payload renders immediately and the visitor
// never sees that wait.
//
// Scope is deliberately narrow — see isCacheable() in api.js. Only public,
// unauthenticated GETs land here. Anything tied to a signed-in person
// (cart, orders, addresses, profile) is never written to disk, because
// localStorage is readable by any script on the origin and survives logout
// on shared machines.
//
// This does NOT reduce image or video bytes. Those are served straight
// from the network and cached by the browser's own HTTP cache; nothing in
// JS-land can improve on that, and the 5MB localStorage budget could not
// hold them anyway.

// Bumping the version orphans every old entry at once. Do that whenever a
// cached response's SHAPE changes, so a returning visitor with a v1 body
// in storage can't feed it to code expecting v2.
const PREFIX = "mdn:cache:v1:";

// A single response bigger than this is not worth a slot: the full
// catalogue call (`limit: 1000`) is the only realistic one that gets
// close, and letting one entry eat most of the 5MB budget would evict
// everything else on the next write.
const MAX_ENTRY_BYTES = 600 * 1024;

// localStorage throws instead of returning null when it's disabled —
// Safari private mode, cookie-blocking extensions, some embedded
// webviews. Probe once and fall back to a no-op cache rather than
// wrapping every call site in try/catch.
const storage = (() => {
  try {
    const probe = `${PREFIX}__probe__`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
})();

const keysOf = () => {
  const out = [];
  for (let i = 0; i < storage.length; i += 1) {
    const k = storage.key(i);
    if (k && k.startsWith(PREFIX)) out.push(k);
  }
  return out;
};

// Drop expired entries first, and if that wasn't enough, the oldest
// half of what's left. Called only when a write has already failed on
// quota, so the cost of the full scan is irrelevant here.
const evict = () => {
  const now = Date.now();
  const live = [];

  keysOf().forEach((k) => {
    try {
      const entry = JSON.parse(storage.getItem(k));
      if (!entry || entry.expiresAt <= now) storage.removeItem(k);
      else live.push({ k, storedAt: entry.storedAt });
    } catch {
      // Unparseable entry — a truncated write from a previous quota
      // failure. It can never be served, so reclaim the space.
      storage.removeItem(k);
    }
  });

  live.sort((a, b) => a.storedAt - b.storedAt);
  live.slice(0, Math.ceil(live.length / 2)).forEach(({ k }) => storage.removeItem(k));
};

export const readCache = (key) => {
  if (!storage) return null;

  const raw = storage.getItem(PREFIX + key);
  if (!raw) return null;

  try {
    const entry = JSON.parse(raw);
    if (!entry || typeof entry !== "object") return null;

    // An expired entry is deleted rather than merely ignored, so a page
    // the visitor stopped browsing doesn't hold its slot forever.
    if (entry.expiresAt <= Date.now()) {
      storage.removeItem(PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    storage.removeItem(PREFIX + key);
    return null;
  }
};

export const writeCache = (key, data, ttlMs) => {
  if (!storage) return;

  let payload;
  try {
    payload = JSON.stringify({ storedAt: Date.now(), expiresAt: Date.now() + ttlMs, data });
  } catch {
    return; // circular / non-serializable — nothing to cache
  }

  if (payload.length > MAX_ENTRY_BYTES) return;

  try {
    storage.setItem(PREFIX + key, payload);
  } catch {
    // Almost certainly QuotaExceededError. Make room and retry once; if
    // it still fails the visitor simply goes uncached, which is only ever
    // a speed regression, never a broken page.
    try {
      evict();
      storage.setItem(PREFIX + key, payload);
    } catch {
      /* give up silently */
    }
  }
};

// Wipes only this module's keys. The PREFIX check matters: `token`,
// `refreshToken`, `user` and `guestCart` share this origin's storage, and
// a blanket localStorage.clear() here would sign the visitor out and throw
// away a guest's cart.
export const clearApiCache = () => {
  if (!storage) return;
  keysOf().forEach((k) => storage.removeItem(k));
};
