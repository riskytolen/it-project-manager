/**
 * Indonesian-friendly text capitalization helpers.
 *
 * Designed to be applied on blur (not on every keystroke) so the user is
 * never disturbed mid-typing.
 */

// Words that stay lowercase in title case (Indonesian + common English).
// They get capitalized if they appear as the very first word.
const LOWERCASE_WORDS = new Set([
  // Indonesian conjunctions
  "dan",
  "atau",
  "tetapi",
  "namun",
  "serta",
  "lalu",
  "kemudian",
  // Indonesian prepositions
  "di",
  "ke",
  "dari",
  "pada",
  "untuk",
  "oleh",
  "dengan",
  "dalam",
  "tentang",
  "kepada",
  "demi",
  "secara",
  // Articles / particles
  "yang",
  "ini",
  "itu",
  "si",
  "sang",
  // English conjunctions/articles (often appear in tech text)
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "nor",
  "for",
  "of",
  "on",
  "in",
  "to",
  "with",
  "by",
  "as",
  "at",
  "via",
]);

/** Heuristic to detect acronyms / mixed-case identifiers we shouldn't touch. */
function looksLikeAcronymOrIdentifier(token: string) {
  // Pure URL-ish or contains @ / / / . characters (probably technical)
  if (/[@\/.]/.test(token)) return true;
  // Contains digits (e.g. version, model, IDs)
  if (/\d/.test(token)) return true;
  const letters = token.replace(/[^A-Za-z]/g, "");
  if (letters.length === 0) return false;
  // Already mostly uppercase (acronym like HRM, API, CI, CD)
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (letters.length <= 5 && upper / letters.length >= 0.6) return true;
  // Has internal capital after lowercase (camelCase / PascalCase like MyApp)
  if (/[a-z][A-Z]/.test(token)) return true;
  return false;
}

function capitalizeFirstLetter(word: string) {
  if (!word) return word;
  // find first letter (skip leading punctuation)
  const idx = word.search(/\p{L}/u);
  if (idx === -1) return word;
  return (
    word.slice(0, idx) +
    word.charAt(idx).toLocaleUpperCase("id-ID") +
    word.slice(idx + 1).toLocaleLowerCase("id-ID")
  );
}

/**
 * Convert a string to Indonesian title case.
 * - Capitalizes the first letter of every "important" word
 * - Leaves conjunctions/prepositions/articles in lowercase (unless first word)
 * - Preserves acronyms, identifiers, URLs, version-like tokens
 */
export function toTitleCase(input: string): string {
  if (!input) return input;
  // Collapse internal whitespace runs but keep leading/trailing as-is
  const trimmed = input.replace(/[ \t]+/g, " ");
  const tokens = trimmed.split(/(\s+)/); // keep whitespace tokens

  let firstWordSeen = false;
  return tokens
    .map((token) => {
      if (/^\s+$/.test(token) || token === "") return token;

      if (looksLikeAcronymOrIdentifier(token)) {
        firstWordSeen = true;
        return token;
      }

      const lower = token.toLocaleLowerCase("id-ID");
      const isFirst = !firstWordSeen;
      firstWordSeen = true;

      if (!isFirst && LOWERCASE_WORDS.has(lower)) {
        return lower;
      }
      return capitalizeFirstLetter(lower);
    })
    .join("")
    .trim();
}

/**
 * Sentence case: capitalize the first letter of each sentence.
 * Sentences are split on `.`, `!`, `?`, or hard line breaks.
 * Preserves acronyms/identifiers in the middle of sentences.
 */
export function toSentenceCase(input: string): string {
  if (!input) return input;

  // Split into segments per line to preserve user's manual line breaks.
  const lines = input.split(/(\r?\n)/);

  return lines
    .map((seg) => {
      if (/^\r?\n$/.test(seg)) return seg;

      // Split sentences while keeping the delimiters
      const parts = seg.split(/([.!?]+\s+)/);
      return parts
        .map((part) => {
          if (/^[.!?]+\s+$/.test(part) || !part) return part;

          // Lowercase only the first word; keep the rest as-typed
          const m = part.match(/^(\s*)(\S+)([\s\S]*)$/);
          if (!m) return part;
          const [, lead, firstWord, rest] = m;

          if (looksLikeAcronymOrIdentifier(firstWord)) {
            return part;
          }
          return lead + capitalizeFirstLetter(firstWord) + rest;
        })
        .join("");
    })
    .join("");
}

export type AutoFormatMode = "title" | "sentence";

export function applyAutoFormat(value: string, mode?: AutoFormatMode) {
  if (!mode) return value;
  return mode === "title" ? toTitleCase(value) : toSentenceCase(value);
}
