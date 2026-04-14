
// ─────────────────────────────────────────────────────────────────────────────

// Live position store: projectId (int) → Position[]
export const bridgePositionStore = {};

// Subscriber list
const _subscribers = [];

/**
 * Called by masterplanssettingsdata after any pin mutation.
 * masterplans.js listens via subscribeToBridgeChanges.
 */
export function notifyBridgeChange(projectId) {
  const id = parseInt(projectId, 10);
  _subscribers.forEach(fn => { try { fn(id); } catch (_) {} });
}

/**
 * masterplans.js calls this to react to pin changes.
 * Returns an unsubscribe function.
 */
export function subscribeToBridgeChanges(fn) {
  _subscribers.push(fn);
  return () => {
    const i = _subscribers.indexOf(fn);
    if (i !== -1) _subscribers.splice(i, 1);
  };
}
