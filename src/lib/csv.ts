/**
 * CSV helpers — Sprint B14.
 *
 * Cung cấp 4 utilities dùng cho tất cả export endpoint:
 *  - `escapeCsvCell(value)`: escape 1 cell (commas, quotes, newlines) theo RFC 4180.
 *  - `buildCsv(headers, rows)`: build chuỗi CSV hoàn chỉnh với UTF-8 BOM + CRLF (Excel
 *    hiển thị đúng tiếng Việt).
 *  - `csvResponse(filename, csv)`: trả NextResponse với Content-Type/Disposition headers.
 *  - `parseCsv(text)`: parser tối thiểu RFC 4180 (handle quoted commas, escaped quotes).
 *
 * Zero deps — không cần thư viện nặng (papaparse, csv-stringify) cho MVP.
 */

/**
 * Escape 1 cell theo RFC 4180:
 *  - Nếu chứa `,`, `"`, `\n`, `\r` → bọc trong quotes, escape `"` thành `""`.
 *  - Ngược lại → trả về nguyên si.
 *  - null / undefined → trả về empty string.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s === '') return ''
  // Cần quote nếu chứa ký tự đặc biệt
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Build full CSV string từ headers (string[]) + rows (unknown[][]).
 *  - Tự động escape mỗi cell qua `escapeCsvCell`.
 *  - Thêm UTF-8 BOM đầu file (Excel hiểu BOM là UTF-8).
 *  - Join rows bằng CRLF (RFC 4180 chuẩn).
 */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const BOM = '\uFEFF'
  const CRLF = '\r\n'
  const headerLine = headers.map(escapeCsvCell).join(',')
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(','))
  return BOM + [headerLine, ...bodyLines].join(CRLF)
}

/**
 * Trả về NextResponse với headers đúng cho CSV download.
 *  - Content-Type: text/csv; charset=utf-8
 *  - Content-Disposition: attachment; filename="<name>"
 */
export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // Không cache — CSV export luôn phải fresh.
      'Cache-Control': 'no-store',
    },
  })
}

/**
 * Format Date thành yyyy-MM-dd (date only). Nếu null → empty.
 */
export function formatCsvDate(d: Date | null | undefined): string {
  if (!d) return ''
  return d.toISOString().split('T')[0]
}

/**
 * Format Date thành yyyy-MM-dd HH:mm:ss (datetime). Nếu null → empty.
 */
export function formatCsvDateTime(d: Date | null | undefined): string {
  if (!d) return ''
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

/**
 * Format number/string an toàn cho CSV.
 *  - Decimal (Prisma) → dùng toString() trước (sẽ là "1234.56" không có dấu phẩy).
 *  - null/undefined → ''.
 */
export function formatCsvNumber(n: unknown): string {
  if (n === null || n === undefined) return ''
  if (typeof n === 'number') return n.toString()
  if (typeof n === 'string') return n
  if (typeof n === 'object' && n !== null && 'toString' in n) {
    return (n as { toString(): string }).toString()
  }
  return ''
}

/**
 * Format boolean → 'true' / 'false'.
 */
export function formatCsvBool(b: unknown): string {
  return b ? 'true' : 'false'
}

/**
 * Parser CSV tối thiểu RFC 4180.
 *  - Hỗ trợ quoted cells với embedded commas (`"a, b"`).
 *  - Hỗ trợ escaped quotes (`""` → `"`).
 *  - Skip dòng trống.
 *
 * Output: { headers: string[], rows: string[][] }
 *
 * Không hỗ trợ:
 *  - Multi-line quoted cells (`"line1\nline2"`). Snipe-It export không có.
 *  - BOM stripping (caller xử lý nếu cần).
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  // Strip BOM nếu có
  const cleaned = text.startsWith('\uFEFF') ? text.slice(1) : text

  const records: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]

    if (inQuotes) {
      if (ch === '"') {
        // Có thể là escaped quote ("") hoặc kết thúc quote
        if (cleaned[i + 1] === '"') {
          cell += '"'
          i++ // skip next "
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(cell)
        cell = ''
      } else if (ch === '\n' || ch === '\r') {
        // End of row — bỏ qua \r\n hoặc \n
        row.push(cell)
        cell = ''
        if (row.length > 1 || row[0] !== '') {
          records.push(row)
        }
        row = []
        // Bỏ qua \n sau \r
        if (ch === '\r' && cleaned[i + 1] === '\n') i++
      } else {
        cell += ch
      }
    }
  }

  // Push last cell/row nếu có
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    if (row.length > 1 || row[0] !== '') records.push(row)
  }

  if (records.length === 0) {
    return { headers: [], rows: [] }
  }

  const [headers, ...rows] = records
  return {
    headers: headers.map((h) => h.trim()),
    rows,
  }
}