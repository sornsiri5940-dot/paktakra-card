/* global TextEncoder, TextDecoder, btoa, atob */
/**
 * การ์ดเซอร์ไพรส์ฟรี — ตัวแปลงการ์ด <-> ลิงก์
 *
 * เนื้อการ์ดทั้งหมดอยู่ในลิงก์ (หลังเครื่องหมาย #) — ไม่มีเซิร์ฟเวอร์ ไม่เก็บข้อมูลใคร
 * ส่วนหลัง # เบราว์เซอร์ไม่ส่งไปที่เซิร์ฟเวอร์ที่โฮสต์หน้านี้ด้วย
 *
 * ลิงก์เป็นของที่ "ใครก็แต่งได้" → ทุกค่าที่ถอดออกมาต้องตรวจ ห้ามเชื่อ:
 * ชนิดการ์ดต้องอยู่ในรายการ · ความยาวมีเพดาน · ตัดอักขระควบคุมทิ้ง · ลิงก์ของขวัญไม่อยู่ในการ์ดเลย
 */

export const LIMITS = Object.freeze({ name: 30, message: 300, encoded: 3000 });

/** ชนิดการ์ด — คำถาม/ปุ่มตอบเป็นค่าตายตัว (ไม่ให้แต่งเอง) ลิงก์จะได้สั้นและไม่มีใครยัดคำแปลกๆ ใส่ปุ่ม */
export const OCCASIONS = Object.freeze({
  ngor: {
    label: 'ง้อ',
    emoji: '🥺',
    envelope: 'มีคนมาง้อ',
    question: 'หายงอนยัง?',
    yes: 'หายแล้ว',
    no: 'ยังงอนอยู่',
    sample: 'ขอโทษนะที่ทำให้โกรธ เค้าผิดเอง ไม่ทำแบบนั้นอีกแล้ว ยกโทษให้เค้านะ',
  },
  fan: {
    label: 'ขอเป็นแฟน',
    emoji: '💗',
    envelope: 'มีคนมีเรื่องจะถาม',
    question: 'เป็นแฟนกันมั้ย?',
    yes: 'เป็น!',
    no: 'ขอคิดก่อน',
    sample: 'คุยกันมาสักพักแล้ว เค้าชอบเวลาที่ได้อยู่กับเธอมาก อยากดูแลเธอแบบจริงจัง',
  },
  bday: {
    label: 'วันเกิด',
    emoji: '🎂',
    envelope: 'มีของขวัญวันเกิดมาส่ง',
    question: null,
    yes: 'ขอบคุณนะ',
    no: null,
    sample: 'สุขสันต์วันเกิดนะ ขอให้ปีนี้เป็นปีที่ดีที่สุด มีแต่เรื่องดีๆ เข้ามา',
  },
  love: {
    label: 'บอกรัก',
    emoji: '🌹',
    envelope: 'มีคนอยากบอกอะไรบางอย่าง',
    question: 'รักเค้ามั้ย?',
    yes: 'รักสิ',
    no: 'ไม่บอกหรอก',
    sample: 'ขอบคุณที่อยู่ข้างกันมาตลอดนะ เค้ารักเธอมากกว่าที่พูดออกไปเยอะเลย',
  },
});

/** ชนิดที่ผู้ส่งเลือกได้ — "reply" เป็นการ์ดที่ระบบสร้างตอนคนรับกดตอบ ไม่ได้อยู่ในรายการนี้ */
export const OCCASION_KEYS = Object.freeze(Object.keys(OCCASIONS));

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‎‏‪-‮⁦-⁩]/g;

/** ตัดอักขระควบคุม/อักขระกลับทิศทาง (ใช้หลอกตาได้) · ช่องชื่อห้ามขึ้นบรรทัดใหม่ · ตัดตามเพดาน (นับเป็นตัวอักษร ไม่ใช่ไบต์) */
export function cleanText(value, max, { multiline = false } = {}) {
  if (typeof value !== 'string') return '';
  let s = value.replace(CONTROL, '');
  s = multiline ? s.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
  s = s.trim();
  const chars = Array.from(s);
  return chars.length > max ? chars.slice(0, max).join('').trim() : s;
}

function toBase64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/*
 * กันคนเอาหน้าเราไปส่งลิงก์หลอก/ข้อความด่า — ตรวจทั้งตอนสร้างและตอนเปิด
 * (ตรวจตอนเปิดคือตัวจริง: คนแต่งลิงก์เองข้ามหน้าสร้างได้ แต่ข้ามตัวถอดลิงก์ไม่ได้)
 * เราลบการ์ดใบไหนทีหลังไม่ได้เลย เพราะไม่มีเซิร์ฟเวอร์ → ต้องกันตั้งแต่ทางเข้า
 * คำหยาบเลือกเฉพาะคำแรงที่ไม่ใช่ส่วนหนึ่งของคำทั่วไป (ไม่ใส่ "มึง/กู" เพราะเพื่อนสนิทใช้หยอกกัน)
 */
const LINK_LIKE = /(https?:|www\.|\.(com|net|org|co|io|me|ly|xyz|shop|link|site|th)\b|\b[a-z0-9-]+\.[a-z]{2,}\/|line\.me|t\.me|bit\.ly)/i;
const RUDE = ['เหี้ย', 'ควย', 'สัส', 'เย็ด', 'อีดอก', 'ระยำ', 'จัญไร', 'ชาติหมา', 'ฆ่า']; // ไม่ใส่ "แม่ง" — ชนคำว่า "แม่งาน"

/** คืนเหตุผลภาษาคน ถ้าข้อความใช้ไม่ได้ · null = ผ่าน */
export function blockedReason(text) {
  if (typeof text !== 'string' || text === '') return null;
  if (LINK_LIKE.test(text)) return 'ใส่ลิงก์หรือชื่อเว็บในการ์ดไม่ได้';
  const squashed = text.replace(/[\s.\-_*]+/g, '');
  if (RUDE.some((w) => squashed.includes(w))) return 'มีคำแรงที่การ์ดนี้ไม่รับ ลองเปลี่ยนคำดูนะ';
  return null;
}

/**
 * ตรวจและทำความสะอาดการ์ด · คืน null ถ้าใช้ไม่ได้
 * การ์ดปกติ: { v:1, o:'ngor'|'fan'|'bday'|'love', to, from, msg }
 * การ์ดตอบกลับ: { v:1, o:'reply', to, from, ro:<ชนิดการ์ดต้นทาง>, a:'yes'|'no' }
 */
export function normalizeCard(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.v !== 1) return null;
  const to = cleanText(raw.to, LIMITS.name);
  const from = cleanText(raw.from, LIMITS.name);
  if (!to || !from) return null;
  if (blockedReason(to) || blockedReason(from)) return null;

  if (raw.o === 'reply') {
    const occ = typeof raw.ro === 'string' && Object.hasOwn(OCCASIONS, raw.ro) ? OCCASIONS[raw.ro] : null;
    if (!occ) return null;
    const a = raw.a === 'no' && occ.no ? 'no' : raw.a === 'yes' ? 'yes' : null;
    if (!a) return null;
    return { v: 1, o: 'reply', to, from, ro: raw.ro, a };
  }

  if (typeof raw.o !== 'string' || !Object.hasOwn(OCCASIONS, raw.o)) return null;
  const msg = cleanText(raw.msg, LIMITS.message, { multiline: true });
  if (!msg || blockedReason(msg)) return null;
  return { v: 1, o: raw.o, to, from, msg };
}

export function encodeCard(card) {
  const clean = normalizeCard(card);
  if (!clean) throw new Error('การ์ดไม่ครบ: ต้องมีชื่อคนรับ ชื่อคนส่ง และข้อความ');
  return toBase64Url(new TextEncoder().encode(JSON.stringify(clean)));
}

/** ถอดการ์ดจากลิงก์ · ลิงก์เสีย/ถูกแก้/ยาวผิดปกติ = null (หน้าเว็บจะขึ้น "ลิงก์นี้เปิดไม่ได้") ไม่โยน error */
export function decodeCard(encoded) {
  if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > LIMITS.encoded) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const json = new TextDecoder('utf-8', { fatal: true }).decode(fromBase64Url(encoded));
    return normalizeCard(JSON.parse(json));
  } catch {
    return null;
  }
}

/** อ่านการ์ดจาก location.hash (รูปแบบ #c=...) */
export function cardFromHash(hash) {
  if (typeof hash !== 'string') return null;
  const m = /^#c=([A-Za-z0-9_-]+)$/.exec(hash);
  return m ? decodeCard(m[1]) : null;
}

/** base = ที่อยู่หน้าเว็บ (ไม่มี #) */
export function cardUrl(base, card) {
  return `${String(base).split('#')[0]}#c=${encodeCard(card)}`;
}

/** คนรับกดตอบ → การ์ดตอบกลับที่สลับชื่อคนส่ง/คนรับ */
export function replyCard(card, answer) {
  const clean = normalizeCard(card);
  if (!clean || clean.o === 'reply') return null;
  return normalizeCard({ v: 1, o: 'reply', to: clean.from, from: clean.to, ro: clean.o, a: answer });
}

/** ข้อความคำตอบที่แสดงบนการ์ดตอบกลับ — มาจากค่าตายตัวของชนิดการ์ด ไม่ได้มาจากลิงก์ */
export function answerText(reply) {
  const occ = OCCASIONS[reply.ro];
  return reply.a === 'no' ? occ.no : occ.yes;
}
