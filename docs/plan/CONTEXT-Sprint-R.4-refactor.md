# CONTEXT: Sprint R.4 - Tech Debt & Refactor

**Bối cảnh:**
Đây là bước cuối cùng trong đợt đại tu hệ thống, hướng tới việc giảm nợ kỹ thuật để ứng dụng có thể maintain và scale lên quy mô lớn hơn (hàng triệu bản ghi). Việc tách các Component béo (Fat Components) giúp tránh merge conflicts về sau, đồng thời việc chuyển load data lên Server Component (Dashboard) khai thác tối đa sức mạnh của Next.js App Router, giúp SEO tốt và giảm thời gian First Contentful Paint.

**Rủi ro:**
- Khi tách `IntegrationsClient.tsx`, hãy chú ý bảo toàn các import và Props truyền xuống. Đảm bảo UI không thay đổi.
- Khi dọn dẹp Dashboard fetch logic, cẩn thận kẻo làm vỡ các biểu đồ Recharts nếu cấu trúc dữ liệu trả về bị lệch.
