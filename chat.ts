import {
  WebSocket,
  isWebSocketCloseEvent,
} from "https://deno.land/std/ws/mod.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";
import { camelize } from "./camelize.ts";

const users = new Map<string, WebSocket>();

function broadcast(message: string, senderId?: string): void {
  // if (!message) return;
  // check message type and value
  // When refreshing the page service, message is [object object] (error object)
  if (!message || Object.prototype.toString.call(message) !== '[object String]') return;
  for (const user of users.values()) {
    // Check if it can be sent
    const isPing = (() => {
      try {
        user && user.send(' ')
        return true
      } catch (error) {
        return false
      }
    })()
    isPing && user.send(senderId ? `[${senderId}]: ${message}` : message);
  }
}

export async function chat(ws: WebSocket): Promise<void> {
  const userId = v4.generate();

  // Register user connection
  users.set(userId, ws);
  broadcast(`> User with the id ${userId} is connected`);

  // Wait for new messages
  for await (const event of ws) {
    const message = camelize(typeof event === "string" ? event : "");

    broadcast(message, userId);

    // Unregister user conection
    if (!message && isWebSocketCloseEvent(event)) {
      users.delete(userId);
      broadcast(`> User with the id ${userId} is disconnected`);
      break;
    }
  }
}
