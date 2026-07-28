# MSEW: Sprint C.4 - Nâng cấp Trải nghiệm (UX) & Bảo mật (Security)

*(Micro-Step Execution Workflow dành cho Tier 2)*

Dưới đây là các bước code chi tiết để xử lý toàn bộ các yêu cầu trong `PLAN-Sprint-C.4.md`. Coder (Tier 2) hãy thực hiện tuần tự và copy/paste cẩn thận.

---

## BƯỚC 1: BẢO MẬT XÓA TÀI SẢN (API & UI)

### 1. Sửa API `src/app/api/assets/[id]/route.ts`
Thêm kiểm tra Password bằng `bcrypt`. Trong hàm `DELETE`:
```typescript
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
// ...
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  
  const body = await req.json().catch(() => ({}))
  const { password } = body

  if (!password) {
    return NextResponse.json({ ok: false, message: 'Yêu cầu nhập mật khẩu xác nhận.' }, { status: 400 })
  }

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!currentUser) return NextResponse.json({ ok: false, message: 'User not found' }, { status: 401 })

  const isPasswordValid = await bcrypt.compare(password, currentUser.password)
  if (!isPasswordValid) {
    return NextResponse.json({ ok: false, message: 'Mật khẩu không chính xác.' }, { status: 403 })
  }

  // Soft Delete
  await prisma.asset.update({
    where: { id: params.id },
    data: { deletedAt: new Date() }
  })
  
  await prisma.actionLog.create({
    data: {
      action: 'DELETE',
      entityType: 'ASSET',
      entityId: params.id,
      userId: session.user.id,
      notes: 'Đã xóa tài sản kèm xác thực mật khẩu.'
    }
  })

  return NextResponse.json({ ok: true, message: 'Đã xóa thành công' })
}
```

### 2. Sửa UI `AssetsPageClient.tsx` & `AssetDetailClient.tsx`
Khai báo thêm State chứa password:
```tsx
const [deletePassword, setDeletePassword] = useState('')
```
Trong Component `<Modal title="Xóa tài sản">`:
```tsx
  <div>
    <p>Bạn có chắc chắn muốn xóa tài sản này? Dữ liệu lịch sử vẫn sẽ được lưu trữ (Soft-delete).</p>
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu xác nhận <span className="text-red-500">*</span></label>
      <input
        type="password"
        value={deletePassword}
        onChange={(e) => setDeletePassword(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg"
        placeholder="Nhập mật khẩu đăng nhập của bạn"
        required
      />
    </div>
  </div>
```
Truyền password vào fetch: `body: JSON.stringify({ password: deletePassword })`. Sau khi xóa xong nhớ `setDeletePassword('')`.

---

## BƯỚC 2: CÀI ĐẶT TOAST NOTIFICATION

1. Chạy lệnh: `npm install react-hot-toast`
2. Mở `src/app/layout.tsx`:
   - Import: `import { Toaster } from 'react-hot-toast'`
   - Render ở cuối thẻ `<body>`: `<Toaster position="bottom-right" />`
3. Mở `src/app/assets/create/page.tsx` và `src/app/assets/[id]/edit/page.tsx`:
   - Import: `import { toast } from 'react-hot-toast'`
   - Trong khối `if (data.ok)`, thêm dòng: `toast.success(editing ? 'Cập nhật tài sản thành công!' : 'Tạo tài sản thành công!')` trước lệnh router.push.

---

## BƯỚC 3: DỌN DẸP `alert()` VÀ `confirm()`
Tier 2 sử dụng chức năng tìm kiếm toàn cục (Global Search) để quét:
- Tìm tất cả các file có chữ `alert(`. Thay thế thành `toast.error(message)` hoặc `toast.success(message)`.
- Tìm tất cả các file có chữ `confirm(`. Refactor thành logic Modal.
Ví dụ chuyển từ `confirm()` sang Modal:
```tsx
const [showConfirm, setShowConfirm] = useState<string | null>(null)
// Thay vì if(!confirm()) return;
// Hãy gọi setShowConfirm(itemId)
// Trải dưới cùng của Component là 1 <Modal>
<Modal open={!!showConfirm} onClose={() => setShowConfirm(null)} title="Xác nhận">
   <p>Bạn có chắc muốn thực hiện thao tác này?</p>
   <div className="flex justify-end gap-3 mt-4">
     <button onClick={() => setShowConfirm(null)}>Hủy</button>
     <button onClick={() => handleExecute(showConfirm)}>Xác nhận</button>
   </div>
</Modal>
```

---

## BƯỚC 4: TOOLTIPS, FORM LAYOUT VÀ UI CLEANUP

1. **Tooltips Khấu hao (`DepreciationTable.tsx`)**
Thêm tooltip giải nghĩa vào các `label`:
```tsx
import { HelpCircle } from 'lucide-react'
//...
<label className="block text-sm font-medium text-gray-700 mb-1 group relative inline-flex items-center gap-1">
  Loại Khấu hao
  <HelpCircle size={14} className="text-gray-400" />
  <span className="invisible group-hover:visible absolute left-full ml-2 w-48 p-2 bg-gray-800 text-white text-xs rounded z-50">
    Tuyến tính (đều đặn) hoặc Nửa năm (chỉ tính 50% năm đầu/cuối).
  </span>
</label>
```

2. **Form Vị trí 2 Cột (`EntityTable.tsx`)**
Trong `<form onSubmit={handleSubmit}>`, tìm khối bao ngoài danh sách các input và đổi class thành grid:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {fields.map(f => (...))}
</div>
```

3. **Đổi tên Cột (`AssetsPageClient.tsx`)**
Tìm thẻ `<th>Người/Vị trí giữ</th>` và sửa thành `<th>Người/Vị trí/Thiết bị giữ</th>`.

4. **Xóa Profile Sidebar (`Sidebar.tsx`)**
Tìm khối div hiển thị `<Avatar>` và tên User (Thường chứa chữ `System Administrator` hoặc `session?.user?.name`). Xóa sạch cả khối div đó đi vì Navbar trên cùng đã đảm nhiệm việc này.

---
**Nhắc nhở Coder (Tier 2):** Test kỹ việc xóa có mật khẩu, test kỹ giao diện không bị vỡ sau khi chia cột và đảm bảo `npx tsc --noEmit` xanh rờn.
