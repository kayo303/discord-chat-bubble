export function hashStringToHsl(name: string): string {
  // 간단한 해시 → HSL 색상(Discord 느낌: 채도/명도는 고정)
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 70% 55%)`;
}

export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // 한글/영문 모두 첫 글자
  return trimmed.slice(0, 1).toUpperCase();
}
