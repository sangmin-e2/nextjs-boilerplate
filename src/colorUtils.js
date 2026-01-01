// 날짜를 yyyyMMdd 형식으로 변환
export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// 간단한 해시 함수 (문자열 -> 32bit 정수)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  return Math.abs(hash);
}

// 명도 계산 (RGB -> Luminance)
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// 날짜 기반 색상 생성
export function generateColors(dateKey) {
  const hash = simpleHash(dateKey);
  
  // HSL 값 생성 (채도와 명도 범위 제한으로 극단적인 색상 방지)
  const hue = hash % 360;
  const saturation = 45 + (hash % 35); // 45-80%
  const lightness = 40 + (hash % 30); // 40-70%
  
  // HSL을 RGB로 변환
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  r = Math.round(r * 255);
  g = Math.round(g * 255);
  b = Math.round(b * 255);
  
  const backgroundColor = `rgb(${r}, ${g}, ${b})`;
  
  // 명도 기반 텍스트 색상 결정
  const luminance = getLuminance(r, g, b);
  const textColor = luminance > 0.5 ? '#1a1a1a' : '#f5f5f5';
  
  return { backgroundColor, textColor };
}
