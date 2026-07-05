import { EventEmitter } from "events";
// Stashed on globalThis so Next.js dev-mode hot reloads reuse the same emitter
// instead of creating a fresh one (and orphaning existing SSE subscribers) on
// every file change. In-memory only — fine for a single Node process; a
// multi-instance deployment would need a shared bus (e.g. Redis pub/sub).
const globalForEvents = globalThis;
function getEmitter() {
    if (!globalForEvents.adminEventEmitter) {
        const emitter = new EventEmitter();
        emitter.setMaxListeners(200);
        globalForEvents.adminEventEmitter = emitter;
    }
    return globalForEvents.adminEventEmitter;
}
export function emitAdminEvent(event) {
    getEmitter().emit("event", event);
}
export function subscribeAdminEvents(listener) {
    const emitter = getEmitter();
    emitter.on("event", listener);
    return () => emitter.off("event", listener);
}
