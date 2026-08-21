/*  analytics.js — what the House learns about its visitors.
 *
 *  Umami Cloud, chosen because it is cookieless: nothing is stored on the
 *  visitor's machine, no identifier follows them off the site, and so no
 *  consent banner has to stand between a person and the courts.
 *
 *  Everything here degrades to a no-op. If the website id is missing, if the
 *  script is blocked, if the visitor asks not to be tracked — track() still
 *  returns without throwing, and the scene never knows the difference. No
 *  analytics call may ever be the reason a wonder fails to open.
 */

const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID;
const HOST = import.meta.env.VITE_UMAMI_HOST || "https://cloud.umami.is";

// The one domain that reports. Umami's own data-domains check drops anything
// sent from anywhere else, so a fork running on someone else's Pages account
// does not quietly pour into this dashboard.
const DOMAIN = "melaniesigrid.github.io";

// A visitor who has set Do Not Track is not counted at all. Umami is already
// anonymous enough that this is not legally required — it is a choice, and the
// only cost is a slightly smaller number. Flip to false to count everyone.
const RESPECT_DNT = true;

let queue = [];
let ready = false;
let disabled = false;

function dnt() {
  if (!RESPECT_DNT) return false;
  return (
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.msDoNotTrack === "1" ||
    navigator.globalPrivacyControl === true
  );
}

/** Load the Umami script once, then drain whatever was tracked before it landed. */
export function initAnalytics() {
  if (disabled || ready) return;

  // Dev builds, previews and anyone who opted out are simply not measured.
  if (!WEBSITE_ID || !import.meta.env.PROD || dnt()) {
    disabled = true;
    queue = [];
    return;
  }

  const s = document.createElement("script");
  s.async = true;
  s.src = `${HOST}/script.js`;
  s.setAttribute("data-website-id", WEBSITE_ID);
  s.setAttribute("data-domains", DOMAIN);
  s.onload = () => { ready = true; flush(); };
  // Blocked by an extension, offline, cloud down — stop queueing and move on.
  s.onerror = () => { disabled = true; queue = []; };
  document.head.appendChild(s);
}

function flush() {
  const pending = queue;
  queue = [];
  for (const [name, data] of pending) send(name, data);
}

function send(name, data) {
  try {
    window.umami?.track(name, data);
  } catch (err) { /* never let a metric break the House */ }
}

/**
 * Record something a visitor did.
 * @param {string} name  short kebab-case event name (Umami caps these at 50 chars)
 * @param {object} [data] flat properties — strings and numbers only
 */
export function track(name, data) {
  if (disabled) return;
  if (!ready) {
    // The scene mounts long before a third-party script finishes loading, so
    // the earliest and most interesting events — WebGL failing, the pesichah
    // being dismissed — would otherwise be the ones lost. Hold them briefly.
    if (queue.length < 40) queue.push([name, data]);
    return;
  }
  send(name, data);
}
