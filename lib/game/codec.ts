// Обфускация контента: XOR кодов символов с ключом → base36. Не шифрование — защита от случайного
// подсмотра ответов (в публичном репо и в бандле). Без TextEncoder/atob: работает одинаково в Hermes и Node.
const KEY = 'kvartet-4x4';

export function encode(text: string): string {
  const out: string[] = [];
  for (let i = 0; i < text.length; i++) {
    out.push((text.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length)).toString(36));
  }
  return out.join('.');
}

export function decode(data: string): string {
  if (!data) return '';
  return data
    .split('.')
    .map((n, i) => String.fromCharCode(parseInt(n, 36) ^ KEY.charCodeAt(i % KEY.length)))
    .join('');
}
