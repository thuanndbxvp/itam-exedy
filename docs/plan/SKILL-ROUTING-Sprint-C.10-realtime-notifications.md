# SKILL ROUTING: Sprint C.10 - Real-time Notifications & Audio

## Backend (API Routes & Config)
- `.env`: Bổ sung PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER.
- `src/lib/pusher.ts` **(NEW)**: Khởi tạo Pusher Server instance (`new Pusher(...)`).
- `src/app/api/tickets/route.ts`: Sửa hàm POST để gọi `pusher.trigger`.
- `src/app/api/tickets/[id]/route.ts`: Sửa hàm PATCH để gọi `pusher.trigger`.
- `src/app/api/tickets/[id]/comments/route.ts`: Sửa hàm POST để gọi `pusher.trigger`.

## Frontend (UI & Listeners)
- `public/ting-ting.mp3` **(NEW)**: File âm thanh tĩnh.
- `src/components/RealtimeListener.tsx` **(NEW)**: Khởi tạo Pusher Client (`new Pusher(NEXT_PUBLIC_PUSHER_KEY, ...)`). Bắt sự kiện, play audio, show toast, và gọi `useRouter().refresh()`.
- `src/app/layout.tsx`: Import và đặt `<RealtimeListener />` vào vị trí phù hợp trong Body để nó hoạt động ngầm.
