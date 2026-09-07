import type { DeviceType, TextContentType } from '../types';

const SAFE_CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Tạo Session ID ngẫu nhiên 6 ký tự dễ đọc, tránh nhầm lẫn (không có 0/O, 1/I/l)
 */
export function generateSessionId(length = 6): string {
  let result = '';
  const charactersLength = SAFE_CHARACTERS.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += SAFE_CHARACTERS.charAt(randomIndex);
  }
  return result;
}

/**
 * Nhận diện loại thiết bị hiện tại
 */
export function detectDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua);
  if (isTablet) return 'tablet';
  
  const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/.test(ua);
  if (isMobile) return 'mobile';
  
  return 'desktop';
}

/**
 * Tạo tên hiển thị thân thiện cho thiết bị
 */
export function getFriendlyDeviceName(deviceType: DeviceType): string {
  const isMac = /macintosh|mac os x/.test(navigator.userAgent.toLowerCase());
  const isWindows = /windows/.test(navigator.userAgent.toLowerCase());
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isAndroid = /android/.test(navigator.userAgent.toLowerCase());

  if (deviceType === 'mobile') {
    if (isIOS) return 'iPhone';
    if (isAndroid) return 'Android Phone';
    return 'Phone';
  }
  if (deviceType === 'tablet') {
    if (isIOS) return 'iPad';
    return 'Tablet';
  }
  if (isMac) return 'Mac';
  if (isWindows) return 'Windows PC';
  return 'Computer';
}

/**
 * Tự động phân loại nội dung văn bản (OTP, URL, Code, Text)
 */
export function detectContentType(rawText: string): TextContentType {
  const trimmed = rawText.trim();
  
  // Kiểm tra nếu là URL
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    return 'url';
  }
  
  // Kiểm tra nếu là Mã OTP (4 đến 8 chữ số, hoặc chữ số có gạch nối như 123-456)
  if (/^(\d{4,8}|\d{3}-\d{3}|\d{4}-\d{4})$/.test(trimmed)) {
    return 'otp';
  }

  // Kiểm tra nếu là đoạn code
  if (
    trimmed.startsWith('```') ||
    /(function\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|import\s+.*from|class\s+\w+|{\s*[\w"']+\s*:|=>|<\/?\w+.*>)/.test(trimmed)
  ) {
    return 'code';
  }

  return 'text';
}

/**
 * Sao chép an toàn vào Clipboard với fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
    }
  }

  // Fallback cho trình duyệt cũ hoặc non-secure context
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Định dạng thời gian hiển thị
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
