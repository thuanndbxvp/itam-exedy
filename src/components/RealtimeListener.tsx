"use client";

/**
 * RealtimeListener Component
 * Sprint C.10 - Real-time Notifications
 *
 * Lắng nghe Pusher events và:
 * - Play audio notification
 * - Show toast sử dụng custom Toast system
 * - Refresh router để cập nhật danh sách
 */
import { useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
const CHANNEL_NAME = "helpdesk-updates";

export default function RealtimeListener() {
  const router = useRouter();
  const { show } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    // Skip if Pusher not configured
    if (!PUSHER_KEY || !PUSHER_CLUSTER) {
      console.warn("[RealtimeListener] Pusher not configured, skipping real-time features");
      return;
    }

    // Initialize audio element (lazy)
    if (!audioRef.current) {
      audioRef.current = new Audio("/ting-ting.mp3");
      audioRef.current.volume = 0.7;
    }

    // Initialize Pusher client
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });
    pusherRef.current = pusher;

    // Subscribe to helpdesk channel
    const channel = pusher.subscribe(CHANNEL_NAME);

    // Helper to play sound safely (browser may block auto-play)
    const playSound = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Ignore autoplay blocked - toast still works
        });
      }
    };

    // Event: ticket-created
    channel.bind("ticket-created", (data: { ticketId: string; title: string; code?: string }) => {
      playSound();
      show({
        type: "success",
        message: `Ticket mới: ${data.code ?? data.ticketId}`,
      });
      router.refresh();
      window.dispatchEvent(new CustomEvent("ticket-changed"));
    });

    // Event: ticket-updated
    channel.bind("ticket-updated", (data: { ticketId: string; code?: string; message?: string }) => {
      playSound();
      show({
        type: "info",
        message: data.message ?? `Cập nhật ticket: ${data.code ?? data.ticketId}`,
      });
      router.refresh();
      window.dispatchEvent(new CustomEvent("ticket-changed"));
    });

    // Cleanup on unmount
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(CHANNEL_NAME);
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [router, show]);

  // This component renders nothing visible
  return null;
}
