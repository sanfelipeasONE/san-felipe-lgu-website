import sanitizeHtml from "sanitize-html";

/**
 * Robust HTML sanitizer for Municipal News editorial content.
 * Prevents stored XSS by strictly stripping dangerous tags, inline event handlers,
 * and malicious javascript: / data: URI protocols.
 */
export function sanitizeArticleHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "";
  }

  return sanitizeHtml(rawHtml, {
    allowedTags: [
      "h2",
      "h3",
      "p",
      "strong",
      "b",
      "em",
      "i",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "br",
      "hr",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto", "tel"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        // Enforce safe attributes on hyperlinks
        return {
          tagName: "a",
          attribs: {
            ...attribs,
            rel: "noopener noreferrer",
          },
        };
      },
    },
    disallowedTagsMode: "discard",
  });
}
