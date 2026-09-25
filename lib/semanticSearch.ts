// Keyboard layout mapping (Kedmanee <-> English)
const EN_TO_TH: Record<string, string> = {
  'q': 'ๆ', 'w': 'ไ', 'e': 'ำ', 'r': 'พ', 't': 'ะ', 'y': 'ั', 'u': 'ี', 'i': 'ร', 'o': 'น', 'p': 'ย', '[': 'บ', ']': 'ล',
  'a': 'ฟ', 's': 'ห', 'd': 'ก', 'f': 'ด', 'g': 'เ', 'h': '้', 'j': '่', 'k': 'า', 'l': 'ส', ';': 'ว', "'": 'ง',
  'z': 'ผ', 'x': 'ป', 'c': 'แ', 'v': 'อ', 'b': 'ิ', 'n': 'ื', 'm': 'ท', ',': 'ม', '.': 'ใ', '/': 'ฝ',
  'Q': '๐', 'W': '\"', 'E': 'ฎ', 'R': 'ฑ', 'T': 'ธ', 'Y': 'ํ', 'U': '๊', 'I': 'ณ', 'O': 'ฯ', 'P': 'ญ', '{': 'ฐ', '}': ',',
  'A': 'ฤ', 'S': 'ฆ', 'D': 'ฏ', 'F': 'โ', 'G': 'ฌ', 'H': '็', 'J': '๋', 'K': 'ษ', 'L': 'ศ', ':': 'ซ', '"': '.',
  'Z': '(', 'X': ')', 'C': 'ฉ', 'V': 'ฮ', 'B': 'ฺ', 'N': '์', 'M': '?', '<': 'ฒ', '>': 'ฬ', '?': 'ฦ',
  '1': 'ๅ', '2': '/', '3': '-', '4': 'ภ', '5': 'ถ', '6': 'ุ', '7': 'ึ', '8': 'ค', '9': 'ต', '0': 'จ', '-': 'ข', '=': 'ช',
  '!': '+', '@': '๑', '#': '๒', '$': '๓', '%': '๔', '^': 'ู', '&': '฿', '*': '๕', '(': '๖', ')': '๗', '_': '๘', '+': '๙'
};

const TH_TO_EN: Record<string, string> = {};
for (const [en, th] of Object.entries(EN_TO_TH)) {
  TH_TO_EN[th] = en;
}

export function convertKeyboardLayout(text: string): { original: string; converted: string } {
  const trimmed = text.trim();
  const thConverted = trimmed.split('').map(c => EN_TO_TH[c] || c).join('');
  const enConverted = trimmed.split('').map(c => TH_TO_EN[c] || c).join('');
  const converted = thConverted !== trimmed ? thConverted : enConverted;
  return { original: trimmed, converted };
}

export function getQueryVariants(text: string): string[] {
  if (!text || !text.trim()) return [];
  const { original, converted } = convertKeyboardLayout(text);
  const set = new Set([original.toLowerCase(), converted.toLowerCase()]);
  return Array.from(set).filter(Boolean);
}

// Multilingual Semantic Concepts
export interface SemanticConcept {
  id: string;
  categoryHints: string[];
  terms: string[];
}

export const SEMANTIC_CONCEPTS: SemanticConcept[] = [
  {
    id: "phone",
    categoryHints: ["Electronics"],
    terms: [
      "มือถือ", "โทรศัพท์", "สมาร์ทโฟน", "ไอโฟน",
      "phone", "iphone", "iphxne", "smartphone", "mobile", "cellphone", "telephone"
    ]
  },
  {
    id: "tablet",
    categoryHints: ["Electronics"],
    terms: [
      "ไอแพด", "แท็บเล็ต", "แทบเล็ต",
      "ipad", "tablet", "galaxy tab"
    ]
  },
  {
    id: "laptop",
    categoryHints: ["Electronics"],
    terms: [
      "โน้ตบุ๊ก", "โน๊ตบุ๊ค", "โน้ตบุ๊ค", "คอม", "แล็ปท็อป", "แมคบุ๊ก", "แมคบุ๊ค",
      "laptop", "notebook", "macbook", "computer", "pc"
    ]
  },
  {
    id: "headphones",
    categoryHints: ["Electronics"],
    terms: [
      "หูฟัง", "แอร์พอด", "แอร์พ็อด",
      "airpods", "earbuds", "earphone", "headphones", "headset"
    ]
  },
  {
    id: "wallet",
    categoryHints: ["Wallet"],
    terms: [
      "กระเป๋าตัง", "กระเป๋าตังค์", "กระเป๋าสตางค์", "กระเป๋าเงิน", "เป๋าตัง", "เป๋าตังค์", "กระเป๋าใส่เงิน",
      "wallet", "purse", "billfold", "money clip"
    ]
  },
  {
    id: "bag",
    categoryHints: ["Bag", "Other"],
    terms: [
      "กระเป๋า", "กระเป๋าเป้", "เป้", "กระเป๋าสะพาย", "ถุงผ้า", "ย่าม",
      "bag", "backpack", "tote", "handbag", "shoulder bag"
    ]
  },
  {
    id: "card",
    categoryHints: ["Other", "Document"],
    terms: [
      "บัตร", "บัตรประชาชน", "บัตรนักศึกษา", "คีย์การ์ด", "ใบขับขี่", "บัตรเอทีเอ็ม",
      "card", "student card", "id card", "keycard", "license", "atm"
    ]
  },
  {
    id: "key",
    categoryHints: ["Other"],
    terms: [
      "กุญแจ", "ลูกกุญแจ", "พวงกุญแจ", "กุญแจรถ", "กุญแจห้อง",
      "key", "keys", "keychain", "car key", "room key"
    ]
  },
  {
    id: "watch",
    categoryHints: ["Watch", "Electronics", "Other"],
    terms: [
      "นาฬิกา", "สมาร์ทวอทช์", "แอปเปิ้ลวอทช์",
      "watch", "smartwatch", "apple watch"
    ]
  },
  {
    id: "glasses",
    categoryHints: ["Other"],
    terms: [
      "แว่น", "แว่นตา", "แว่นกันแดด", "แว่นสายตา",
      "glasses", "sunglasses", "spectacles"
    ]
  }
];

// Multilingual Color Dictionary
export const COLOR_DICTIONARY: Record<string, string[]> = {
  "ดำ": ["black", "ดำ", "สีดำ", "dark"],
  "สีดำ": ["black", "ดำ", "สีดำ", "dark"],
  "black": ["black", "ดำ", "สีดำ", "dark"],
  "ขาว": ["white", "ขาว", "สีขาว"],
  "สีขาว": ["white", "ขาว", "สีขาว"],
  "white": ["white", "ขาว", "สีขาว"],
  "แดง": ["red", "แดง", "สีแดง"],
  "สีแดง": ["red", "แดง", "สีแดง"],
  "red": ["red", "แดง", "สีแดง"],
  "น้ำเงิน": ["blue", "น้ำเงิน", "สีน้ำเงิน", "ฟ้า", "สีฟ้า", "navy"],
  "สีน้ำเงิน": ["blue", "น้ำเงิน", "สีน้ำเงิน", "ฟ้า", "สีฟ้า", "navy"],
  "ฟ้า": ["blue", "ฟ้า", "สีฟ้า", "cyan", "sky"],
  "สีฟ้า": ["blue", "ฟ้า", "สีฟ้า", "cyan", "sky"],
  "blue": ["blue", "น้ำเงิน", "สีน้ำเงิน", "ฟ้า", "สีฟ้า", "navy", "cyan"],
  "เขียว": ["green", "เขียว", "สีเขียว"],
  "สีเขียว": ["green", "เขียว", "สีเขียว"],
  "green": ["green", "เขียว", "สีเขียว"],
  "เหลือง": ["yellow", "เหลือง", "สีเหลือง"],
  "สีเหลือง": ["yellow", "เหลือง", "สีเหลือง"],
  "yellow": ["yellow", "เหลือง", "สีเหลือง"],
  "ชมพู": ["pink", "ชมพู", "สีชมพู", "rose"],
  "สีชมพู": ["pink", "ชมพู", "สีชมพู", "rose"],
  "pink": ["pink", "ชมพู", "สีชมพู", "rose"],
  "ม่วง": ["purple", "ม่วง", "สีม่วง", "violet"],
  "สีม่วง": ["purple", "ม่วง", "สีม่วง", "violet"],
  "purple": ["purple", "ม่วง", "สีม่วง", "violet"],
  "ส้ม": ["orange", "ส้ม", "สีส้ม"],
  "สีส้ม": ["orange", "ส้ม", "สีส้ม"],
  "orange": ["orange", "ส้ม", "สีส้ม"],
  "ทอง": ["gold", "ทอง", "สีทอง", "golden"],
  "สีทอง": ["gold", "ทอง", "สีทอง", "golden"],
  "gold": ["gold", "ทอง", "สีทอง", "golden"],
  "เงิน": ["silver", "เงิน", "สีเงิน"],
  "สีเงิน": ["silver", "เงิน", "สีเงิน"],
  "silver": ["silver", "เงิน", "สีเงิน"],
  "เทา": ["gray", "grey", "เทา", "สีเทา"],
  "สีเทา": ["gray", "grey", "เทา", "สีเทา"],
  "gray": ["gray", "grey", "เทา", "สีเทา"],
  "grey": ["gray", "grey", "เทา", "สีเทา"],
  "น้ำตาล": ["brown", "น้ำตาล", "สีน้ำตาล"],
  "สีน้ำตาล": ["brown", "น้ำตาล", "สีน้ำตาล"],
  "brown": ["brown", "น้ำตาล", "สีน้ำตาล"]
};

// Multilingual Brand Dictionary
export const BRAND_DICTIONARY: Record<string, string[]> = {
  "แอปเปิ้ล": ["apple", "apply", "แอปเปิ้ล", "แอปเปิล"],
  "แอปเปิล": ["apple", "apply", "แอปเปิ้ล", "แอปเปิล"],
  "apple": ["apple", "apply", "แอปเปิ้ล", "แอปเปิล"],
  "apply": ["apply", "apple", "แอปเปิ้ล", "แอปเปิล"],
  "ซัมซุง": ["samsung", "ซัมซุง"],
  "samsung": ["samsung", "ซัมซุง"],
  "เสียวหมี่": ["xiaomi", "เสียวหมี่", "เสี่ยวมี่"],
  "เสี่ยวมี่": ["xiaomi", "เสียวหมี่", "เสี่ยวมี่"],
  "xiaomi": ["xiaomi", "เสียวหมี่", "เสี่ยวมี่"],
  "ออปโป้": ["oppo", "ออปโป้"],
  "oppo": ["oppo", "ออปโป้"],
  "วีโว่": ["vivo", "วีโว่"],
  "vivo": ["vivo", "วีโว่"],
  "โซนี่": ["sony", "โซนี่"],
  "sony": ["sony", "โซนี่"],
  "ไนกี้": ["nike", "ไนกี้"],
  "nike": ["nike", "ไนกี้"],
  "อาดิดาส": ["adidas", "อาดิดาส"],
  "adidas": ["adidas", "อาดิดาส"]
};

export function findMatchingConcept(queryText: string): SemanticConcept | null {
  const variants = getQueryVariants(queryText);
  for (const v of variants) {
    for (const concept of SEMANTIC_CONCEPTS) {
      if (concept.terms.some(t => v.includes(t) || t.includes(v))) {
        return concept;
      }
    }
  }
  return null;
}

export function getSynonymColors(colorInput: string): string[] {
  const variants = getQueryVariants(colorInput);
  const result: string[] = [];
  for (const v of variants) {
    const list = COLOR_DICTIONARY[v];
    if (list) {
      result.push(...list);
    } else {
      result.push(v);
    }
  }
  return Array.from(new Set(result));
}

export function getSynonymBrands(brandInput: string): string[] {
  const variants = getQueryVariants(brandInput);
  const result: string[] = [];
  for (const v of variants) {
    const list = BRAND_DICTIONARY[v];
    if (list) {
      result.push(...list);
    } else {
      result.push(v);
    }
  }
  return Array.from(new Set(result));
}