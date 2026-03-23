// Offensive language filter — focused on racial slurs, ethnic slurs, and
// highly offensive hate speech. General profanity is intentionally NOT filtered.

const OFFENSIVE_TERMS = [
  // Anti-Black
  'nigger', 'nigga', 'niggers', 'niggas', 'nig', 'nigg', 'negro', 'negros',
  'jiggaboo', 'jigaboo', 'sambo', 'sambos', 'coon', 'coons', 'darkie', 'darkies',
  'porchmonkey', 'spearchucker',
  // Anti-Asian
  'chink', 'chinks', 'chinky', 'chinaman', 'chinamen', 'chingchong',
  'gook', 'gooks', 'zipperhead', 'zipperheads', 'jap', 'japs',
  // Anti-Hispanic/Latino
  'spic', 'spics', 'spick', 'spicks', 'wetback', 'wetbacks',
  'beaner', 'beaners', 'gringo', 'gringos',
  // Anti-Jewish
  'kike', 'kikes',
  // Anti-Middle Eastern / South Asian
  'raghead', 'ragheads', 'towelhead', 'towelheads', 'sandnigger', 'sandniggers',
  'cameljockey', 'paki', 'pakis',
  // Anti-Italian
  'wop', 'wops', 'dago', 'dagos',
  // Anti-Indigenous
  'redskin', 'redskins', 'squaw',
  // Anti-White (included for consistency)
  'honky', 'honkey', 'honkies', 'cracker', 'crackers',
  // Mixed / general ethnic slurs
  'halfbreed', 'mudskin', 'mudpeople', 'coolie', 'coolies',
  // Anti-LGBTQ+
  'faggot', 'faggots', 'fag', 'fags', 'dyke', 'dykes',
  'tranny', 'trannies',
  // Ableist
  'retard', 'retards', 'retarded',
];

// Common letter substitutions used to evade filters
const SUBSTITUTIONS: Record<string, string> = {
  '@': 'a',
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '$': 's',
  '5': 's',
  '7': 't',
  '4': 'a',
  '!': 'i',
  '+': 't',
  '8': 'b',
  '9': 'g',
  '6': 'g',
  '2': 'z',
};

// Cyrillic and other Unicode lookalikes that map to Latin letters
const UNICODE_LOOKALIKES: Record<string, string> = {
  '\u0430': 'a', // Cyrillic а
  '\u0435': 'e', // Cyrillic е
  '\u043e': 'o', // Cyrillic о
  '\u0441': 'c', // Cyrillic с
  '\u0440': 'p', // Cyrillic р
  '\u0443': 'y', // Cyrillic у
  '\u0445': 'x', // Cyrillic х
  '\u0456': 'i', // Cyrillic і
  '\u0458': 'j', // Cyrillic ј
  '\u04bb': 'h', // Cyrillic һ
  '\u0501': 'd', // Cyrillic ԁ
  '\u0261': 'g', // Latin small script g
};

function normalize(text: string): string {
  let result = text.toLowerCase();

  // Strip zero-width characters
  result = result.replace(/[\u200B\u200C\u200D\uFEFF\u00AD\u034F\u2060\u2061\u2062\u2063\u2064]/g, '');

  // Strip diacritics (é→e, ñ→n, ü→u, etc.)
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Replace Unicode lookalikes
  for (const [char, replacement] of Object.entries(UNICODE_LOOKALIKES)) {
    result = result.split(char).join(replacement);
  }

  // Replace common number/symbol substitutions
  for (const [char, replacement] of Object.entries(SUBSTITUTIONS)) {
    result = result.split(char).join(replacement);
  }

  // Strip ALL non-letter characters (catches every separator trick:
  // spaces, dots, asterisks, slashes, pipes, commas, etc.)
  result = result.replace(/[^a-z]/g, '');

  // Collapse repeated characters: 3+ of the same letter → 2
  // (preserves "oo" in "coon", "gg" in "nigger", but catches "niggggger")
  result = result.replace(/(.)\1{2,}/g, '$1$1');

  return result;
}

// Build regex patterns with word boundaries for the original text check
const TERM_PATTERNS = OFFENSIVE_TERMS.map(
  (term) => new RegExp(`\\b${term}\\b`, 'i')
);

export function containsOffensiveLanguage(text: string): boolean {
  // Check 1: Direct match with word boundaries (catches plain usage)
  for (const pattern of TERM_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  // Check 2: Normalized text (catches letter substitutions, spacing tricks,
  // Unicode evasion, repeated letters, and every separator variation)
  const normalized = normalize(text);
  for (const term of OFFENSIVE_TERMS) {
    if (normalized.includes(term)) return true;
  }

  return false;
}
