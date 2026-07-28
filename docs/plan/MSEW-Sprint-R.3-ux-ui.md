# MSEW-Sprint-R.3: Thực thi UX/UI Refactor

> **Lưu ý cho Tier 2:** Chỉ tập trung sửa file `Sidebar.tsx`.

## BƯỚC 1: XÓA DROPDOWN MENU BÁO CÁO & ĐỔI ICON
- **File:** `src/components/Sidebar.tsx`
- **Hành động:** 
  1. Thêm import `FolderOpen`, `Box`, `Factory`, `Package` từ `lucide-react`.
  2. Tại mảng `NAVIGATION_GROUPS`:
     - Nhóm "Quản lý Tài sản", sửa trường `icon` cho 4 menu: 'Loại tài sản' (`FolderOpen`), 'Model thiết bị' (`Box`), 'Nhà sản xuất' (`Factory`), 'Nhà cung cấp' (`Package`).
     - Nhóm "Vận hành & Hỗ trợ", tách menu 'Báo cáo' (đang có `children`) thành 2 object ngang hàng: 'Báo cáo' (icon `BarChart3`, href `/reports`) và 'Chi phí IT' (icon `DollarSign`, href `/reports/costs`).

## BƯỚC 2: XÓA KHỐI USER PROFILE Ở SIDEBAR
- **File:** `src/components/Sidebar.tsx`
- **Hành động:** 
  1. Trong hàm `Sidebar()`, tìm đoạn comment `{/* User info */}`.
  2. Xóa bỏ hoàn toàn khối `{session?.user && ( <div className="px-4 py-3 border-b border-slate-800 shrink-0"> ... </div> )}`.
  3. Có thể xóa luôn các hàm helper `getInitials`, `ROLE_LABELS`, `ROLE_BADGE_COLORS` và biến `session` (nếu không còn dùng ở đâu khác trong file, nhưng hãy cẩn thận vì `session?.user?.id` có thể vẫn đang dùng ở hàm `useEffect` get permissions).

## BƯỚC 3: NÂNG CẤP CSS PHÂN CẤP GROUP HEADERS
- **File:** `src/components/Sidebar.tsx`
- **Hành động:** 
  1. Trong hàm map `NAVIGATION_GROUPS.map((group, idx) => ...)`. (Nhớ thêm tham số `idx` vào map function nếu chưa có).
  2. Tìm khối `{/* Group header */}`.
  3. Sửa className của thẻ `div` bọc ngoài Group Header thành như sau (chú ý logic `idx > 0`):
     ```tsx
     <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider mb-2 ${
       idx > 0 ? 'mt-5 border-t border-slate-800 pt-4' : ''
     } ${
       groupActive ? 'text-blue-400' : 'text-slate-500'
     }`}>
       <span>{group.label}</span>
     </div>
     ```
     *(Lưu ý: Đã xóa `<group.icon size={13} />` để ẩn icon của tiêu đề nhóm đi).*
