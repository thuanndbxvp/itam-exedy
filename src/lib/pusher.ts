/**
 * Pusher Server Instance
 * Sprint C.10 - Real-time Notifications
 *
 * Dùng trong API Routes để trigger events tới Pusher Channels.
 */
import Pusher from "pusher";

// Validate env vars at module load time
const appId = process.env.PUSHER_APP_ID ?? "";
const key = process.env.NEXT_PUBLIC_PUSHER_KEY ?? "";
const secret = process.env.PUSHER_SECRET ?? "";
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "";

if (!process.env.PUSHER_APP_ID || !process.env.NEXT_PUBLIC_PUSHER_KEY ||
    !process.env.PUSHER_SECRET || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
  console.warn(
    "[Pusher] Missing env vars: PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER. " +
    "Real-time notifications will not work until these are set in .env"
  );
}

const pusher = new Pusher({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});

export default pusher;

// Channel & Event constants for type safety
export const CHANNEL_HELPDESK = "helpdesk-updates";
export const EVENT_TICKET_CREATED = "ticket-created";
export const EVENT_TICKET_UPDATED = "ticket-updated";
