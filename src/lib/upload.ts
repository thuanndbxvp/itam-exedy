/**
 * Upload service stub — Epic I chưa triển khai `/api/upload` endpoint.
 * Tier 2 tạo stub minimal: convert file → data-URI base64 (lưu trực tiếp vào User.avatar).
 *
 * Phase 4.5: Dùng data-URI cho MVP (≤1MB image).
 * Phase 5 (Epic I): Replace bằng S3 / Vercel Blob / filesystem storage.
 *
 * Khi Epic I xong: chỉ cần đổi implementation, signature giữ nguyên
 * → user-panel code không phải sửa.
 */

export type UploadType = 'avatar' | 'asset-image' | 'ticket-attachment'

export interface UploadInput {
  file: File
  type: UploadType
  entityId: string
}

export interface UploadResult {
  ok: boolean
  url?: string
  error?: string
}

const ALLOWED_TYPES: Record<UploadType, string[]> = {
  avatar: ['image/png', 'image/jpeg', 'image/webp'],
  'asset-image': ['image/png', 'image/jpeg', 'image/webp'],
  'ticket-attachment': [
    'image/png', 'image/jpeg', 'image/webp',
    'application/pdf', 'text/plain',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}

const MAX_SIZE_BYTES: Record<UploadType, number> = {
  avatar: 1024 * 1024,        // 1 MB
  'asset-image': 5 * 1024 * 1024, // 5 MB
  'ticket-attachment': 10 * 1024 * 1024, // 10 MB
}

/**
 * Upload 1 file → trả URL để lưu vào DB column.
 *
 * Phase 4.5 stub: convert File → base64 data-URI (bypass file system).
 * LƯU Ý: data-URI lưu trong DB sẽ phình DB nhanh. Chỉ MVP. Phase 5 bắt buộc chuyển
 * sang storage backend thật (S3/Blob).
 */
export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  const { file, type, entityId } = input

  if (!file) {
    return { ok: false, error: 'Chưa chọn file.' }
  }

  // Validate size
  const maxBytes = MAX_SIZE_BYTES[type]
  if (file.size > maxBytes) {
    return { ok: false, error: `File vượt quá ${Math.round(maxBytes / 1024 / 1024)}MB.` }
  }

  // Validate MIME
  const allowed = ALLOWED_TYPES[type]
  if (!allowed.includes(file.type)) {
    return { ok: false, error: `Loại file ${file.type} không được phép.` }
  }

  // Validate entityId (basic — gọi upload API sẽ check ownership)
  if (!entityId || entityId.length === 0) {
    return { ok: false, error: 'entityId không hợp lệ.' }
  }

  // === STUB: data-URI ===
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const b64 = buffer.toString('base64')
    const url = `data:${file.type};base64,${b64}`

    return {
      ok: true,
      url,
    }
  } catch (e) {
    const err = e as Error
    return { ok: false, error: `Upload lỗi: ${err.message}` }
  }
}