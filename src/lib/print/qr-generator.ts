/**
 * QR generator — Sprint C1.
 *
 * Tạo QR code cho asset labels.
 *
 * Input: assetTag + baseUrl → QR encode URL `https://<host>/assets/<assetId>` (deep-link scan).
 *       Hoặc chỉ encode assetTag (cho print label đơn giản).
 *
 * Output: PNG Data URI + SVG string (cho print khác nhau).
 */
import QRCode from 'qrcode'

/**
 * Tạo QR Data URI (PNG).
 * @param content URL hoặc string cần encode
 * @param width pixels
 */
export async function generateQrDataUri(content: string, width = 200): Promise<string> {
  return QRCode.toDataURL(content, {
    width,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  })
}

/**
 * Tạo QR SVG string (vector — print đẹp hơn).
 */
export async function generateQrSvg(content: string): Promise<string> {
  return QRCode.toString(content, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  })
}

/**
 * Build URL để QR deep-link vào asset detail page.
 */
export function assetDeepLink(baseUrl: string, assetId: string): string {
  return `${baseUrl.replace(/\/$/, '')}/assets/${assetId}`
}
