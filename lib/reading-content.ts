import sanitizeHtml from "sanitize-html";

/**
 * The reader intentionally supports a small, presentation-only HTML subset.
 * Keep this list in one place so content is cleaned before it reaches the
 * client reader and existing legacy rows receive defense-in-depth protection.
 */
const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "blockquote",
  "pre",
  "code",
  "sub",
  "sup",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": ["class", "id"],
  a: ["href", "title", "target", "rel", "class", "id"],
  img: ["src", "alt", "width", "height", "class", "id"],
  th: ["colspan", "rowspan", "class", "id"],
  td: ["colspan", "rowspan", "class", "id"],
};

export function looksLikeReaderHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

export function sanitizeReaderHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto"],
      img: ["http", "https"],
    },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
  });
}

/** Preserve plain text exactly; sanitize only content that is treated as HTML. */
export function sanitizeReaderContent(value: string): string {
  return looksLikeReaderHtml(value) ? sanitizeReaderHtml(value) : value;
}
