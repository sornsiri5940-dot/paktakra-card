/* global document, window, navigator, location, history, setTimeout, matchMedia */
import { OCCASIONS, OCCASION_KEYS, LIMITS, cardFromHash, cardUrl, replyCard, answerText, cleanText, blockedReason } from './codec.js';
import { giftsFor, isGiftUrl } from './gifts.js';

/*
 * กติกาความปลอดภัยของไฟล์นี้: ข้อความทุกตัวที่มาจากลิงก์ใส่ผ่าน textContent เท่านั้น — ห้ามใช้ innerHTML
 * ลิงก์ที่ใส่ในปุ่มมีแค่ 3 แบบ: ลิงก์การ์ดที่เราสร้างเอง · LINE share · ลิงก์ของขวัญที่ผ่าน isGiftUrl
 */

const app = document.getElementById('app');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BASE = () => `${location.origin}${location.pathname}`;

/** สร้าง element โดยไม่แตะ innerHTML · children ที่เป็น string กลายเป็น text node */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof window.Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function mount(...nodes) {
  app.replaceChildren(...nodes);
  const focusTarget = app.querySelector('[data-focus]');
  if (focusTarget) focusTarget.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

const lineShareUrl = (text) => `https://line.me/R/share?text=${encodeURIComponent(text)}`;

/** คัดลอกลิงก์ — clipboard อาจถูกบล็อก (แอป LINE/IG เปิดเว็บในตัว) → เลือกข้อความให้กดค้างเองแทน ห้ามพังเงียบ */
async function copyLink(input, statusEl) {
  try {
    await navigator.clipboard.writeText(input.value);
    statusEl.textContent = 'คัดลอกแล้ว วางในแชตได้เลย';
  } catch {
    input.focus();
    input.select();
    statusEl.textContent = 'คัดลอกอัตโนมัติไม่ได้ในแอปนี้ — กดค้างที่ลิงก์แล้วเลือก "คัดลอก"';
  }
}

function shareBlock(url, text, { lineLabel }) {
  const input = h('input', { class: 'link-field', type: 'text', readonly: true, value: url, 'aria-label': 'ลิงก์การ์ด' });
  const status = h('p', { class: 'hint', role: 'status', 'aria-live': 'polite' });
  const actions = h(
    'div',
    { class: 'actions' },
    h('a', { class: 'btn btn-line', href: lineShareUrl(`${text} ${url}`), target: '_blank', rel: 'noopener' }, lineLabel),
    h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => copyLink(input, status) }, 'คัดลอกลิงก์'),
    typeof navigator.share === 'function'
      ? h('button', {
          class: 'btn btn-ghost',
          type: 'button',
          onclick: () => navigator.share({ text, url }).catch(() => {}),
        }, 'แชร์ไปแอปอื่น')
      : null,
  );
  return h('div', { class: 'share' }, input, actions, status);
}

function giftBlock(occasion, { title, lead }) {
  const gifts = giftsFor(occasion).filter((g) => isGiftUrl(g.url));
  if (gifts.length === 0) return null;
  return h(
    'section',
    { class: 'gifts', 'aria-labelledby': 'gifts-title' },
    h('h2', { id: 'gifts-title' }, title),
    h('p', { class: 'hint' }, lead),
    h('p', { class: 'fineprint' }, 'ลิงก์ของขวัญเป็นลิงก์ affiliate ของ Shopee — ถ้าซื้อผ่านลิงก์ เราได้ค่าคอมเล็กน้อย ราคาที่คุณจ่ายเท่าเดิม'),
    h(
      'ul',
      { class: 'gift-list' },
      gifts.map((g) =>
        h(
          'li',
          {},
          h(
            'a',
            { class: 'gift', href: g.url, target: '_blank', rel: 'noopener sponsored' },
            h('span', { class: 'gift-text' }, h('span', { class: 'gift-name' }, g.name), h('span', { class: 'gift-why' }, g.why)),
            h('span', { class: 'gift-price' }, `~${new Intl.NumberFormat('th-TH').format(g.price)} บาท`),
          ),
        ),
      ),
    ),
    h('p', { class: 'fineprint' }, 'ราคาเช็กเมื่อ 16 พ.ย. 2026 อาจเปลี่ยนแล้ว'),
  );
}

function footer() {
  return h(
    'footer',
    { class: 'foot' },
    h('p', {}, 'การ์ดนี้ไม่เก็บข้อมูลไว้ที่ไหนเลย ข้อความทั้งหมดอยู่ในลิงก์ — ใครมีลิงก์ก็เปิดอ่านได้ ส่งให้คนที่ตั้งใจส่งเท่านั้นนะ'),
  );
}

/* ---------------- หน้าทำการ์ด ---------------- */

function renderMaker(prefill = {}) {
  document.title = 'ทำการ์ดเซอร์ไพรส์ ฟรี';
  const state = {
    o: OCCASION_KEYS.includes(prefill.o) ? prefill.o : 'ngor',
    to: prefill.to ?? '',
    from: prefill.from ?? '',
    msg: prefill.msg ?? '',
  };

  const previewTo = h('span', { class: 'env-to' });
  const previewLine = h('span', { class: 'env-line' });
  const preview = h(
    'div',
    { class: 'env env-small', 'aria-hidden': 'true' },
    h('span', { class: 'env-flap' }),
    h('span', { class: 'env-seal' }),
    h('span', { class: 'env-label' }, previewLine, previewTo),
  );

  const counter = h('span', { class: 'counter', 'aria-live': 'polite' });
  const toInput = h('input', { id: 'to', name: 'to', type: 'text', maxlength: LIMITS.name, required: true, autocomplete: 'off', value: state.to, placeholder: 'เช่น ตัวเอง' });
  const fromInput = h('input', { id: 'from', name: 'from', type: 'text', maxlength: LIMITS.name, required: true, autocomplete: 'off', value: state.from, placeholder: 'ชื่อเล่นของคุณ' });
  const msgInput = h('textarea', { id: 'msg', name: 'msg', rows: 5, maxlength: LIMITS.message, required: true, placeholder: 'อยากบอกอะไร พิมพ์ได้เลย' });
  msgInput.value = state.msg;
  const error = h('p', { class: 'error', role: 'alert' });
  const result = h('div', { class: 'result', hidden: true });

  function sync() {
    const occ = OCCASIONS[state.o];
    previewLine.textContent = `${occ.emoji} ${occ.envelope}`;
    previewTo.textContent = `ถึง ${cleanText(state.to, LIMITS.name) || '…'}`;
    counter.textContent = `${Array.from(state.msg).length}/${LIMITS.message}`;
  }

  const chips = h(
    'fieldset',
    { class: 'chips' },
    h('legend', {}, 'ส่งเรื่องอะไร'),
    OCCASION_KEYS.map((key) => {
      const occ = OCCASIONS[key];
      const radio = h('input', {
        type: 'radio',
        name: 'occasion',
        value: key,
        checked: key === state.o,
        onchange: () => {
          state.o = key;
          result.hidden = true;
          sync();
        },
      });
      return h('label', { class: 'chip' }, radio, h('span', {}, `${occ.emoji} ${occ.label}`));
    }),
  );

  toInput.addEventListener('input', () => { state.to = toInput.value; result.hidden = true; sync(); });
  fromInput.addEventListener('input', () => { state.from = fromInput.value; result.hidden = true; sync(); });
  msgInput.addEventListener('input', () => { state.msg = msgInput.value; result.hidden = true; sync(); });

  const sampleBtn = h('button', {
    class: 'link-btn',
    type: 'button',
    onclick: () => {
      msgInput.value = OCCASIONS[state.o].sample;
      state.msg = msgInput.value;
      result.hidden = true;
      sync();
      msgInput.focus();
    },
  }, 'ใช้ข้อความตัวอย่าง');

  const form = h(
    'form',
    {
      class: 'maker',
      novalidate: true,
      onsubmit: (e) => {
        e.preventDefault();
        const card = { v: 1, o: state.o, to: state.to, from: state.from, msg: state.msg };
        if (!cleanText(card.to, LIMITS.name)) return fail('ใส่ชื่อคนที่จะส่งให้ก่อนนะ', toInput);
        if (!cleanText(card.from, LIMITS.name)) return fail('ใส่ชื่อคุณก่อนนะ (ชื่อเล่นก็ได้)', fromInput);
        if (!cleanText(card.msg, LIMITS.message, { multiline: true })) return fail('ยังไม่ได้พิมพ์ข้อความเลย', msgInput);
        for (const [value, input] of [[card.to, toInput], [card.from, fromInput], [card.msg, msgInput]]) {
          const why = blockedReason(value);
          if (why) return fail(why, input);
        }
        error.textContent = '';
        const url = cardUrl(BASE(), card);
        const occ = OCCASIONS[card.o];
        result.replaceChildren(
          h('h2', { tabindex: '-1', 'data-result': true }, 'การ์ดพร้อมส่งแล้ว'),
          h('p', { class: 'hint' }, `ส่งลิงก์นี้ให้ ${cleanText(card.to, LIMITS.name)} ได้เลย`),
          shareBlock(url, `${occ.emoji} ${occ.envelope} เปิดดูสิ 💌`, { lineLabel: 'ส่งทาง LINE' }),
          h('a', { class: 'link-btn', href: url, target: '_blank', rel: 'noopener' }, 'เปิดดูการ์ดก่อนส่ง'),
          giftBlock(card.o, {
            title: 'แนบของจริงไปด้วยไหม',
            lead: 'การ์ดฟรีอยู่แล้ว ถ้าอยากให้เซอร์ไพรส์กว่านี้ ส่งของไปถึงหน้าบ้านเลย',
          }),
        );
        result.hidden = false;
        result.querySelector('[data-result]').focus({ preventScroll: true });
        result.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
      },
    },
    chips,
    h('div', { class: 'row' },
      h('div', { class: 'field' }, h('label', { for: 'to' }, 'ส่งถึง'), toInput),
      h('div', { class: 'field' }, h('label', { for: 'from' }, 'จาก'), fromInput),
    ),
    h('div', { class: 'field' },
      h('div', { class: 'label-row' }, h('label', { for: 'msg' }, 'ข้อความ'), counter),
      msgInput,
      sampleBtn,
    ),
    error,
    h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'สร้างลิงก์การ์ด'),
  );

  function fail(message, input) {
    error.textContent = message;
    input.focus();
  }

  sync();
  mount(
    h('header', { class: 'hero' },
      h('p', { class: 'kicker' }, 'ฟรี · ไม่ต้องสมัคร'),
      h('h1', { tabindex: '-1', 'data-focus': true }, 'ทำการ์ดเซอร์ไพรส์ส่งให้คนสำคัญ'),
      h('p', { class: 'lead' }, 'เลือกเรื่อง พิมพ์ข้อความ ได้ลิงก์ส่งทาง LINE ใน 1 นาที คนรับกดตอบกลับมาหาคุณได้ด้วย'),
      preview,
    ),
    form,
    result,
    footer(),
  );
}

/* ---------------- หน้าเปิดการ์ด ---------------- */

function envelopeStage(card, onOpen) {
  const isReply = card.o === 'reply';
  const occ = OCCASIONS[isReply ? card.ro : card.o];
  const line = isReply ? `${card.from} ตอบกลับมาแล้ว` : `${occ.emoji} ${occ.envelope}`;
  const env = h(
    'button',
    { class: 'env env-big', type: 'button', 'aria-label': 'เปิดจดหมาย', onclick: () => open() },
    h('span', { class: 'env-flap' }),
    h('span', { class: 'env-seal' }),
    h('span', { class: 'env-label' }, h('span', { class: 'env-to' }, `ถึง ${card.to}`)),
  );
  function open() {
    if (reduceMotion) return onOpen();
    env.classList.add('is-open');
    env.disabled = true;
    setTimeout(onOpen, 420);
  }
  return h('section', { class: 'stage stage-envelope' },
    h('h1', { tabindex: '-1', 'data-focus': true }, line),
    env,
    h('button', { class: 'btn btn-primary', type: 'button', onclick: () => open() }, 'เปิดจดหมาย'),
  );
}

function letter(card, ...extra) {
  return h('article', { class: 'letter' },
    h('p', { class: 'letter-to' }, `ถึง ${card.to}`),
    h('p', { class: 'letter-body' }, card.msg),
    h('p', { class: 'letter-from' }, `— ${card.from}`),
    ...extra,
    h('p', { class: 'letter-note' }, 'ข้อความนี้คนส่งเขียนเอง ไม่ใช่ข้อความจากเว็บนี้'),
  );
}

/** ปุ่ม "ไม่" หนีได้ 3 ครั้งเฉพาะตอนใช้เมาส์/นิ้ว · กดด้วยคีย์บอร์ดได้ทันที (ไม่ขังคนที่ใช้คีย์บอร์ด) */
function dodgingButton(label, onPick) {
  let dodges = 0;
  const btn = h('button', { class: 'btn btn-ghost btn-no', type: 'button' }, label);
  const dodge = (e) => {
    if (dodges >= 3) return;
    e.preventDefault();
    dodges += 1;
    const x = Math.round((Math.random() - 0.5) * 160);
    const y = Math.round(-20 - Math.random() * 60);
    btn.style.transform = `translate(${x}px, ${y}px)`;
    if (dodges === 3) btn.textContent = `${label} (ก็ได้…)`;
  };
  btn.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') dodge(e); });
  btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') dodge(e); });
  btn.addEventListener('click', (e) => {
    // click จากคีย์บอร์ด (detail === 0) ผ่านเลย · click จากเมาส์/นิ้วผ่านเมื่อหนีครบแล้ว
    if (e.detail === 0 || dodges >= 3) onPick();
  });
  return btn;
}

function letterStage(card) {
  const occ = OCCASIONS[card.o];
  const answer = (a) => mount(answeredStage(card, a));
  const ask = occ.question
    ? h('div', { class: 'ask' },
        h('p', { class: 'ask-q' }, occ.question),
        h('div', { class: 'ask-buttons' },
          h('button', { class: 'btn btn-primary', type: 'button', onclick: () => answer('yes') }, occ.yes),
          dodgingButton(occ.no, () => answer('no')),
        ),
      )
    : h('div', { class: 'ask' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: () => answer('yes') }, `${occ.yes} ${occ.emoji}`),
      );
  return h('section', { class: 'stage' },
    h('h1', { class: 'sr-only', tabindex: '-1', 'data-focus': true }, `จดหมายจาก ${card.from}`),
    letter(card, ask),
  );
}

function answeredStage(card, a) {
  const occ = OCCASIONS[card.o];
  const reply = replyCard(card, a);
  const url = cardUrl(BASE(), reply);
  const said = answerText(reply);
  return h('section', { class: 'stage' },
    h('p', { class: 'kicker' }, 'คุณตอบว่า'),
    h('h1', { class: 'big-answer', tabindex: '-1', 'data-focus': true }, said),
    h('p', { class: 'lead' }, `ส่งคำตอบกลับให้ ${card.from} รู้ด้วยสิ`),
    shareBlock(url, `${card.to} ตอบกลับการ์ด${occ.label}ของคุณแล้ว 💌`, { lineLabel: `ส่งคำตอบให้ ${card.from} ทาง LINE` }),
    a === 'yes'
      ? giftBlock(card.o, { title: 'ตอบแทนด้วยของขวัญ', lead: `อยากให้ ${card.from} ยิ้มกว้างกว่านี้ ส่งของไปด้วยเลย` })
      : null,
    makeOwnCta(),
    footer(),
  );
}

function replyStage(card) {
  const occ = OCCASIONS[card.ro];
  const said = answerText(card);
  return h('section', { class: 'stage' },
    h('h1', { class: 'sr-only', tabindex: '-1', 'data-focus': true }, `คำตอบจาก ${card.from}`),
    h('article', { class: 'letter' },
      h('p', { class: 'letter-to' }, `ถึง ${card.to}`),
      occ.question ? h('p', { class: 'letter-q' }, `ที่ถามว่า "${occ.question}"`) : null,
      h('p', { class: 'letter-answer' }, said),
      h('p', { class: 'letter-from' }, `— ${card.from}`),
    ),
    card.a === 'yes'
      ? giftBlock(card.ro, { title: 'ฉลองด้วยของขวัญ', lead: `ส่งอะไรเล็กๆ ไปให้ ${card.from} ต่อเลย` })
      : null,
    makeOwnCta(),
    footer(),
  );
}

function makeOwnCta() {
  return h('div', { class: 'cta' },
    h('p', {}, 'อยากทำการ์ดแบบนี้ให้คนอื่นบ้าง?'),
    h('a', { class: 'btn btn-ghost', href: BASE() }, 'ทำการ์ดของคุณเอง ฟรี'),
  );
}

function invalidStage() {
  document.title = 'ลิงก์นี้เปิดไม่ได้';
  return h('section', { class: 'stage' },
    h('h1', { tabindex: '-1', 'data-focus': true }, 'ลิงก์นี้เปิดไม่ได้'),
    h('p', { class: 'lead' }, 'อาจคัดลอกลิงก์มาไม่ครบ ลองขอให้คนส่งส่งมาใหม่อีกครั้ง'),
    makeOwnCta(),
  );
}

/* ---------------- เลือกหน้าตามลิงก์ ---------------- */

function route() {
  const hash = location.hash;
  if (!hash || hash === '#') return renderMaker();
  const card = cardFromHash(hash);
  if (!card) return mount(invalidStage());
  document.title = card.o === 'reply' ? `${card.from} ตอบกลับมาแล้ว 💌` : 'มีจดหมายมาถึงคุณ 💌';
  mount(envelopeStage(card, () => mount(card.o === 'reply' ? replyStage(card) : letterStage(card))));
}

window.addEventListener('hashchange', route);
// ลิงก์ "ทำการ์ดของคุณเอง" ชี้ที่หน้าเดิมแบบไม่มี # → เบราว์เซอร์โหลดใหม่เอง ไม่ต้องจัดการเพิ่ม
history.scrollRestoration = 'manual';
route();
