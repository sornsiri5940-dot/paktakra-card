/**
 * ของขวัญที่คัดไว้ต่อชนิดการ์ด — ลิงก์ affiliate ของเรา (ปักตะกร้า)
 *
 * สินค้า/ราคา: data/imports/shopee-bestsellers-2026-11-16.csv (เทสต์เทียบราคากับไฟล์ตามรหัสสินค้า)
 * ราคา = ราคาในไฟล์ ณ 16 พ.ย. 2026 · หน้าเว็บเขียนกำกับว่าราคาอาจเปลี่ยน
 *
 * ลิงก์: ทำที่ affiliate.shopee.co.th → "ลิงก์ที่กำหนดเอง" เมื่อ 24 พ.ย. 2026 (บัญชีของศร ใน Chrome "sorn")
 * Sub_id 1 = giftcard · Sub_id 2 = ชนิดการ์ด (ngor/fan/bday/love) → 1 สินค้ามีลิงก์แยกต่อชนิดการ์ด
 * ตรวจแล้วทุกลิงก์: เปิดแล้วพาไปสินค้ารหัสตรงกัน และ utm_content = giftcard-<ชนิดการ์ด>
 * ดูยอด: รายงานคำสั่งซื้อ → ตัวกรอง Sub_id = giftcard (ติ๊กคอลัมน์ sub_id เพื่อแยกชนิดการ์ด)
 *
 * why = เหตุผลสั้นๆ ว่าทำไมเหมาะ (กติกา Shopee Affiliate ข้อ 8.8: เนื้อหาต้องมีคุณค่ามากกว่าแค่โชว์สินค้า+ลิงก์)
 *   เขียนจากชื่อ/ข้อมูลสินค้าในไฟล์เท่านั้น ห้ามอ้างว่าเคยใช้ หรือสรรพคุณที่ไม่มีในข้อมูล
 *
 * ไม่ใช้รูปสินค้าของ Shopee — ไฟล์ data/product-images.json เขียนไว้ว่ารูปไว้ดูในแดชบอร์ดเท่านั้น
 */
export const SUB_ID = 'giftcard';

export const GIFTS = Object.freeze([
  { id: '50314889563', name: 'เสื้อฮู้ดใส่คู่กับแฟนได้', why: 'ราคาเบาๆ ใส่ไปเดตด้วยกันได้', price: 99, links: { fan: 'https://s.shopee.co.th/20xHRAYdMY', love: 'https://s.shopee.co.th/1CD3WRccq' } },
  { id: '14995820658', name: 'บูลดัก 5 ซอง (ง้อแบบเผ็ดๆ)', why: 'ง้อแบบขำๆ ชวนมากินเผ็ดด้วยกัน', price: 69, links: { ngor: 'https://s.shopee.co.th/6VPgnOVujO' } },
  { id: '22390716846', name: 'ไม้เซลฟี่บลูทูธ ไว้ถ่ายรูปคู่', why: 'ไว้ถ่ายรูปคู่ตอนไปเที่ยวด้วยกัน', price: 146, links: { fan: 'https://s.shopee.co.th/2BGhdTY01b', love: 'https://s.shopee.co.th/BVdFpQzHt' } },
  { id: '46462009296', name: 'คาร์ดิแกนไหมพรมสีชมพู', why: 'อากาศเริ่มเย็น ได้ใส่จริงทุกวัน', price: 178, links: { ngor: 'https://s.shopee.co.th/6L6Gb5WY4N', fan: 'https://s.shopee.co.th/1gKR2YZu2W' } },
  { id: '28286587940', name: 'สเปรย์ฉีดผ้าหอม Oriental Princess', why: 'ฉีดผ้าให้หอม ของใช้ที่ได้ใช้ทุกวัน', price: 206, links: { bday: 'https://s.shopee.co.th/2BGhdUSAGQ', love: 'https://s.shopee.co.th/Lp3S8QLww' } },
  { id: '42273378286', name: 'ผ้าพันคอไหมพรม ไว้กันหนาว', why: 'ของกันหนาวที่ได้ใช้จริงช่วงนี้', price: 209, links: { ngor: 'https://s.shopee.co.th/6q2XC0Ue3U', love: 'https://s.shopee.co.th/W8TeRPibz' } },
  { id: '25235864576', name: 'บลัช OH MY BLUSH DOT', why: 'บลัชชิ้นเล็ก มีให้เลือก 16 สี', price: 254, links: { fan: 'https://s.shopee.co.th/1qdrErZGhZ', bday: 'https://s.shopee.co.th/20xHRBSnbP' } },
  { id: '21111627562', name: 'ลิป Maybelline Vinyl Ink', why: 'ลิปชิ้นเล็กที่ได้ใช้ทุกวัน', price: 287, links: { ngor: 'https://s.shopee.co.th/6fj6zhVHOT', bday: 'https://s.shopee.co.th/1qdrEsTQwO' } },
  { id: '26370406694', name: 'น้ำหอม LACANA (แถมเทสเตอร์)', why: 'น้ำหอม แถมเทสเตอร์อีก 1 กลิ่น', price: 386, links: { bday: 'https://s.shopee.co.th/1gKR2ZU4HN', love: 'https://s.shopee.co.th/gRtqkP5H2' } },
  { id: '43284809150', name: 'แก้วเก็บความเย็น Super Lock x Moomin', why: 'แก้วเก็บความเย็นลาย Moomin', price: 545, links: { bday: 'https://s.shopee.co.th/1W10qGUhcM' } },
].map((g) => Object.freeze({ ...g, links: Object.freeze({ ...g.links }) })));

const ALL_URLS = new Set(GIFTS.flatMap((g) => Object.values(g.links)));

/**
 * ของขวัญของชนิดการ์ดนั้น เรียงถูกไปแพง · แต่ละชิ้นได้ url ของชนิดการ์ดนั้น (Sub ID แยกตามเรื่อง)
 * การ์ดตอบกลับใช้ชนิดของการ์ดต้นทาง
 */
export function giftsFor(occasion, limit = 4) {
  return GIFTS.filter((g) => Object.hasOwn(g.links, occasion))
    .sort((a, b) => a.price - b.price)
    .slice(0, limit)
    .map((g) => ({ id: g.id, name: g.name, why: g.why, price: g.price, url: g.links[occasion] }));
}

/** ลิงก์ที่หน้าเว็บยอมใส่ในปุ่ม — ต้องเป็นลิงก์สั้นของ Shopee ที่อยู่ในรายการนี้เท่านั้น */
export function isGiftUrl(url) {
  return ALL_URLS.has(url) && /^https:\/\/s\.shopee\.co\.th\/[A-Za-z0-9]+$/.test(url);
}
