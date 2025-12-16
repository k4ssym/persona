'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

interface ResultOverlayProps {
  vapi: any;
  assistantText?: string;
  uiLanguage?: 'ru' | 'en';
}

type DirectionResult = {
  department?: string;
  room?: string;
  floor?: string;
  contacts?: string;
  direction?: string;
  raw: string;
};

const HIDE_MS = 30000;

function preferNonEmpty(next: string | undefined, prev: string | undefined): string | undefined {
  if (next == null) return prev;
  const t = String(next).trim();
  return t.length ? t : prev;
}

function mergeSticky(prev: DirectionResult | null, next: DirectionResult): DirectionResult {
  if (!prev) return next;
  return {
    // Keep previously extracted structured fields if the new chunk doesn't include them.
    department: preferNonEmpty(next.department, prev.department),
    room: preferNonEmpty(next.room, prev.room),
    floor: preferNonEmpty(next.floor, prev.floor),
    contacts: preferNonEmpty(next.contacts, prev.contacts),
    direction: preferNonEmpty(next.direction, prev.direction),
    // Always show the latest instruction text.
    raw: next.raw,
  };
}

function extractLabeled(text: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const re = new RegExp(`(^|\\n)\\s*${label}\\s*:\\s*(.+)$`, 'im');
    const m = text.match(re);
    if (m?.[2]) return m[2].trim();
  }
  return undefined;
}

// NOTE: JS \b is ASCII-only; it does not treat Cyrillic as word chars.
// So we use whitespace/start/end guards instead of \b for Russian.
const ORDINAL_FLOOR_PATTERNS: Array<{ re: RegExp; value: string }> = [
  { re: /(?:^|\s)перв(?:ый|ом|ого)(?:\s|$)/gi, value: '1' },
  { re: /(?:^|\s)втор(?:ой|ом|ого)(?:\s|$)/gi, value: '2' },
  { re: /(?:^|\s)трет(?:ий|ьем|ьего)(?:\s|$)/gi, value: '3' },
  { re: /(?:^|\s)четверт(?:ый|ом|ого)(?:\s|$)/gi, value: '4' },
  { re: /(?:^|\s)пят(?:ый|ом|ого)(?:\s|$)/gi, value: '5' },
  { re: /(?:^|\s)шест(?:ой|ом|ого)(?:\s|$)/gi, value: '6' },
  { re: /(?:^|\s)седьм(?:ой|ом|ого)(?:\s|$)/gi, value: '7' },
  { re: /(?:^|\s)восьм(?:ой|ом|ого)(?:\s|$)/gi, value: '8' },
  { re: /(?:^|\s)девят(?:ый|ом|ого)(?:\s|$)/gi, value: '9' },
  { re: /(?:^|\s)десят(?:ый|ом|ого)(?:\s|$)/gi, value: '10' },
];

function normalizeText(input: string): string {
  return String(input ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeNavigation(text: string): boolean {
  const t = normalizeText(text);
  if (!t) return false;
  return /(каб\.?|кабинет|комната|этаж|отдел|тел\.?|телефон|почта|email|e-mail|@|налево|направо|прямо|вперед|слева|справа|повернит|свернит|идит|пройдит|войдит|подним|спуст|лифт|лестниц|коридор|вход|room|office|floor|department|dept\.?|phone|tel\.?|left|right|straight|ahead|upstairs|downstairs|elevator|stairs|corridor|hallway|turn|go|walk|enter)/i.test(
    t,
  );
}

function deriveDirection(text: string): string | undefined {
  const lower = normalizeText(text);
  if (!lower) return undefined;
  if (/(налево|слева|\bleft\b)/i.test(lower)) return '← left / налево';
  if (/(направо|справа|\bright\b)/i.test(lower)) return '→ right / направо';
  if (/(вверх|наверх|подним|\bupstairs\b|\bgo up\b)/i.test(lower)) return '↑ up / вверх';
  if (/(вниз|спуст|\bdownstairs\b|\bgo down\b)/i.test(lower)) return '↓ down / вниз';
  if (/(прямо|вперед|\bstraight\b|\bahead\b)/i.test(lower)) return '↑ straight / прямо';
  if (/(лифт|лестниц|\belevator\b|\bstairs\b)/i.test(lower)) return '↑ elevator / stairs';
  if (/(коридор|\bcorridor\b|\bhallway\b)/i.test(lower)) return '→ corridor';
  return undefined;
}

function parseDirectionResult(raw: string): DirectionResult | null {
  const text = String(raw ?? '').trim();
  if (!text) return null;

  // 1) If the assistant provided labeled lines, use them.
  const labeledDepartment = extractLabeled(text, ['ОТДЕЛ', 'DEPARTMENT']);
  const labeledRoom = extractLabeled(text, ['КАБИНЕТ', 'ROOM', 'OFFICE']);
  const labeledFloor = extractLabeled(text, ['ЭТАЖ', 'FLOOR']);
  const labeledContacts = extractLabeled(text, ['КОНТАКТЫ', 'CONTACTS', 'PHONE']);
  const labeledDirection = extractLabeled(text, ['НАПРАВЛЕНИЕ', 'DIRECTION']);
  const labeledHasAny = Boolean(labeledDepartment || labeledRoom || labeledFloor || labeledContacts || labeledDirection);
  if (labeledHasAny) {
    return {
      department: labeledDepartment,
      room: labeledRoom,
      floor: labeledFloor,
      contacts: labeledContacts,
      direction: labeledDirection,
      raw: text,
    };
  }

  // 2) Otherwise, heuristically extract from natural speech.
  const normalized = normalizeText(text);

  const roomPatterns: RegExp[] = [
    // "кабинет 214", "каб. №214", "в кабинете 101" (no \b because Cyrillic)
    /(?:каб(?:инет)?\.?|кабинет(?:е|у|а|ом)?|комната(?:е|у|а|ой)?)\s*(?:[:№#-]|№)?\s*([0-9]{1,4}(?:[\-\/][0-9]{1,4})?[a-zа-я]?)/i,
    // "№214" right after the word: "кабинет№214"
    /(?:каб(?:инет)?\.?|кабинет(?:е|у|а|ом)?|комната(?:е|у|а|ой)?)\s*№\s*([0-9]{1,4}(?:[\-\/][0-9]{1,4})?[a-zа-я]?)/i,
    // reversed order: "214 кабинет"
    /([0-9]{1,4}(?:[\-\/][0-9]{1,4})?[a-zа-я]?)\s*(?:каб(?:инет)?\.?|кабинет(?:е|у|а|ом)?|комната(?:е|у|а|ой)?)/i,
    // English: "Room 214", "Office 214", "Rm. 214"
    /\b(?:room|rm\.?|office)\s*(?:[:#-]|no\.?|number)?\s*([0-9]{1,4}(?:[\-\/][0-9]{1,4})?[a-z]?)/i,
    // English reversed: "214 room"
    /([0-9]{1,4}(?:[\-\/][0-9]{1,4})?[a-z]?)\s*\b(?:room|rm\.?|office)\b/i,
  ];

  let roomMatch: RegExpMatchArray | null = null;
  for (const re of roomPatterns) {
    roomMatch = text.match(re);
    if (roomMatch?.[1]) break;
  }

  const floorMatchA = text.match(/этаж\s*#?\s*([0-9]{1,2})/i);
  const floorMatchB = text.match(/([0-9]{1,2})\s*(?:-?\s*[йм])?\s*этаж/i);
  const floorMatchC = text.match(/на\s+([0-9]{1,2})\s*(?:-?\s*м)?\s+этаже/i);
  const floorMatchEnA = text.match(/\bfloor\s*#?\s*([0-9]{1,2})/i);
  const floorMatchEnB = text.match(/\b([0-9]{1,2})(?:st|nd|rd|th)?\s*floor\b/i);
  const floorMatchEnC = text.match(/\bon\s+the\s+([0-9]{1,2})(?:st|nd|rd|th)?\s+floor\b/i);

  const phoneMatch = text.match(/(?:\bтел\.?|\bтелефон|\bphone\b|\btel\.?\b)\s*[:\-]?\s*([+\d][\d\s()\-]{5,})/i);
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  const deptMatch =
    text.match(/\bотдел\s+([A-Za-zА-Яа-я0-9«»"'()\-\s]{2,60})(?=[\.,;\n]|$)/i) ||
    text.match(/\bотдел(ение)?\s+([A-Za-zА-Яа-я0-9«»"'()\-\s]{2,60})(?=[\.,;\n]|$)/i) ||
    text.match(/\bdepartment\s+([A-Za-z0-9“”"'()\-\s]{2,60})(?=[\.,;\n]|$)/i) ||
    text.match(/\bdept\.?\s+([A-Za-z0-9“”"'()\-\s]{2,60})(?=[\.,;\n]|$)/i);

  const department = deptMatch
    ? String((deptMatch[2] ?? deptMatch[1] ?? '')).trim().replace(/\s{2,}/g, ' ')
    : undefined;

  const room = roomMatch?.[1]?.trim()?.toUpperCase();

  let floor: string | undefined;
  if (floorMatchA?.[1]) floor = floorMatchA[1];
  else if (floorMatchB?.[1]) floor = floorMatchB[1];
  else if (floorMatchC?.[1]) floor = floorMatchC[1];
  else if (floorMatchEnA?.[1]) floor = floorMatchEnA[1];
  else if (floorMatchEnB?.[1]) floor = floorMatchEnB[1];
  else if (floorMatchEnC?.[1]) floor = floorMatchEnC[1];
  else {
    // Example: "на втором этаже" (no digits)
    if (/этаж(е|а)?/i.test(text)) {
      for (const { re, value } of ORDINAL_FLOOR_PATTERNS) {
        if (re.test(normalized)) {
          floor = value;
          break;
        }
      }
    }

    // English ordinals without digits
    if (!floor && /\bfloor\b/i.test(text)) {
      const ordEn: Array<{ re: RegExp; value: string }> = [
        { re: /\bfirst\b/i, value: '1' },
        { re: /\bsecond\b/i, value: '2' },
        { re: /\bthird\b/i, value: '3' },
        { re: /\bfourth\b/i, value: '4' },
        { re: /\bfifth\b/i, value: '5' },
        { re: /\bsixth\b/i, value: '6' },
        { re: /\bseventh\b/i, value: '7' },
        { re: /\beighth\b/i, value: '8' },
        { re: /\bninth\b/i, value: '9' },
        { re: /\btenth\b/i, value: '10' },
      ];
      for (const { re, value } of ordEn) {
        if (re.test(normalized)) {
          floor = value;
          break;
        }
      }
    }
  }

  const contactsParts: string[] = [];
  if (phoneMatch?.[1]) contactsParts.push(phoneMatch[1].trim());
  if (emailMatch?.[0]) contactsParts.push(emailMatch[0].trim());
  const contacts = contactsParts.length ? contactsParts.join(' / ') : undefined;

  const direction = deriveDirection(text);

  const hasAny = Boolean(department || room || floor || contacts || direction);
  if (!hasAny) {
    // If the assistant said something but we couldn't extract fields, still show the card
    // with the original instruction text.
    return { direction, raw: text };
  }

  return { department, room, floor, contacts, direction, raw: text };
}

export default function ResultOverlay({ vapi, assistantText, uiLanguage = 'ru' }: ResultOverlayProps) {
  const [result, setResult] = useState<DirectionResult | null>(null);

  const ui = useMemo(() => {
    if (uiLanguage === 'en') {
      return {
        instruction: 'Instruction',
        department: 'Department',
        room: 'Room',
        floor: 'Floor',
        contacts: 'Contacts',
        follow: 'Follow the instruction below',
        route: 'Route',
      };
    }
    return {
      instruction: 'Инструкция',
      department: 'Отдел',
      room: 'Кабинет',
      floor: 'Этаж',
      contacts: 'Контакты',
      follow: 'Следуйте инструкции ниже',
      route: 'Маршрут',
    };
  }, [uiLanguage]);

  useEffect(() => {
    const text = String(assistantText ?? '').trim();
    if (!text) return;
    const parsed = parseDirectionResult(text);
    if (!parsed) return;
    setResult((prev) => mergeSticky(prev, parsed));
    const t = setTimeout(() => setResult(null), HIDE_MS);
    return () => clearTimeout(t);
  }, [assistantText]);

  useEffect(() => {
    if (!vapi) return;

    let hideTimer: any;

    const onMessage = (message: any) => {
      if (message?.type !== 'transcript') return;
      if (message?.transcriptType === 'partial') return;
      if (message?.role === 'user') return;

      const parsed = parseDirectionResult(message?.transcript);
      if (!parsed) return;
      setResult((prev) => mergeSticky(prev, parsed));
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setResult(null), HIDE_MS);
    };

    vapi.on('message', onMessage);
    return () => {
      try {
        vapi.off('message', onMessage);
      } catch {
        // ignore
      }
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [vapi]);

  const arrow = useMemo(() => {
    const d = result?.direction?.trim();
    if (!d) return '→';
    // If user supplies an arrow already, use it.
    if (/[←→↑↓]/.test(d)) return d;
    return `→ ${d}`;
  }, [result]);

  if (!result) return null;

  const rowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '10rem 1fr',
    gap: '0.75rem',
    alignItems: 'baseline',
    fontSize: '0.875rem',
    lineHeight: 1.4,
  };

  const labelStyle: CSSProperties = {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'rgba(255,255,255,0.55)',
  };

  const valueStyle: CSSProperties = {
    color: 'white',
    fontFamily: "'Courier New', monospace",
    wordBreak: 'break-word',
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: '1.25rem',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        padding: '0 1.25rem',
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div
        style={{
          width: 'min(56rem, 100%)',
          border: '2px solid rgba(255,255,255,0.85)',
          backgroundColor: 'rgba(0,0,0,0.9)',
          padding: '1.25rem 1.25rem 1rem',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-0.75rem',
            left: '1rem',
            backgroundColor: 'black',
            padding: '0 0.5rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontSize: '0.75rem',
            color: 'white',
          }}
        >
          Navigation Result
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            paddingBottom: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'white',
              lineHeight: 1,
            }}
          >
            {arrow}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              {ui.follow}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginTop: '0.25rem' }}>
              {result.department || result.room || ui.route}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={rowStyle}>
            <div style={labelStyle}>{ui.instruction}</div>
            <div style={valueStyle}>{result.raw}</div>
          </div>
          {result.department && (
            <div style={rowStyle}>
              <div style={labelStyle}>{ui.department}</div>
              <div style={valueStyle}>{result.department}</div>
            </div>
          )}
          {result.room && (
            <div style={rowStyle}>
              <div style={labelStyle}>{ui.room}</div>
              <div style={valueStyle}>{result.room}</div>
            </div>
          )}
          {result.floor && (
            <div style={rowStyle}>
              <div style={labelStyle}>{ui.floor}</div>
              <div style={valueStyle}>{result.floor}</div>
            </div>
          )}
          {result.contacts && (
            <div style={rowStyle}>
              <div style={labelStyle}>{ui.contacts}</div>
              <div style={valueStyle}>{result.contacts}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
