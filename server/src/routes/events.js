import { Router } from "express";
import { requireStaff } from "../middleware/auth.js";
import { subscribeAdminEvents } from "#lib/events";

export const eventsRouter = Router();

/** Same role Next's Route Handler + ReadableStream played — just Express's
 * plain res.write() idiom instead of the Fetch API controller/encoder one. */
eventsRouter.get("/admin/events", requireStaff, (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const send = (data) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      // response already closed (client disconnected mid-write)
    }
  };

  send({ type: "connected" });

  const unsubscribe = subscribeAdminEvents(send);

  // Keeps the connection alive through idle proxies/timeouts.
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on("close", () => {
    unsubscribe();
    clearInterval(heartbeat);
  });
});
