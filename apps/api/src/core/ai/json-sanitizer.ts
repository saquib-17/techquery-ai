/**
 * Defensive JSON Sanitizer & Extractor.
 * Extracts valid JSON structures from raw LLM responses that may be surrounded
 * by markdown code blocks (```json ... ```), conversational text, or preamble/postamble.
 */
export class JsonSanitizer {
  /**
   * Sanitizes a raw string by stripping markdown fences and extracting the balanced JSON structure.
   */
  public static extractJson(raw: string): string {
    if (!raw || typeof raw !== "string") {
      return "{}";
    }

    let text = raw.trim();

    // 1. Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      text = codeBlockMatch[1].trim();
    }

    // 2. Locate the outermost balanced JSON object ({...}) or array ([...])
    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");

    let startIndex = -1;
    let isObject = true;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIndex = firstBrace;
      isObject = true;
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
      isObject = false;
    }

    if (startIndex === -1) {
      // No JSON brackets found, return as-is for JSON.parse to throw structured error
      return text;
    }

    const openChar = isObject ? "{" : "[";
    const closeChar = isObject ? "}" : "]";

    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let endIndex = -1;

    for (let i = startIndex; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === openChar) {
          depth++;
        } else if (char === closeChar) {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }

    if (endIndex !== -1) {
      return text.substring(startIndex, endIndex + 1).trim();
    }

    // Fallback: search for last occurrence of closeChar
    const lastClose = text.lastIndexOf(closeChar);
    if (lastClose > startIndex) {
      return text.substring(startIndex, lastClose + 1).trim();
    }

    return text.substring(startIndex).trim();
  }
}
