const allowedElements = [
  "font",
  "del",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "p",
  "a",
  "ul",
  "ol",
  "sup",
  "sub",
  "li",
  "b",
  "i",
  "u",
  "strong",
  "em",
  "strike",
  "code",
  "hr",
  "br",
  "div",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "caption",
  "pre",
  "span",
  "img",
  "details",
  "summary",
] as const;

const attributeMap: Record<string, Array<string>> = {
  font: ["data-mx-bg-color", "data-mx-color", "color"],
  span: ["data-mx-bg-color", "data-mx-color", "data-mx-spoiler"],
  // must contain rel="noopener"
  a: ["name", "target", "href"],
  img: ["width", "height", "alt", "title", "src"],
  ol: ["start"],
  code: ["class"],
};

const AllowedSchemes = {
  href: ["https", "http", "ftp", "mailto", "magnet"],
  img: ["mxc"],
};

type Kind = (typeof allowedElements)[number];

type HtmlElement = {
  kind: Kind;
  atrributes: Record<string, string>;
  inner: string | HtmlElement | null;
  before: string | null;
  after: string | null;
};

const FormattedBodyParser = (s: string) => {
  const maxDepth = 3;

  const nestedPattern =
    /<(?<open>[\S]+)\s?(?<attrs>.+)>(?<body>.+)?<\/(?<close>[\S]+)>/;
  const singlePattern = /<(?<open>[\S]+)\s?(?<attrs>.+)\s?\/>/;

  const recurse = (parent: HtmlElement) => {
    const before = s.indexOf("<");
    if (before >= 0) {
      parent.before = s.slice(0, before - 1);

      s = s.slice(before - 1);
    }

    const after = s.lastIndexOf(">");
    if (after >= 0) {
      parent.after = s.slice(after + 1);

      s = s.slice(before - 1);
    }

    const nesting = s.match(nestedPattern);

    if (nesting && nesting.groups) {
      const { body, attrs, open, close } = nesting.groups;

      if (allowedElements.indexOf(open as Kind) < 0) {
        throw new Error();
      }

      parent.kind = open as Kind;

      if (open !== close) {
        throw new Error();
      }

      if (attrs) {
      }

      if (body) {
        const inner = body.match(/.*[<>].*/) ? recurse(body) : body;

        // do we want null for empty bodies?
        parent.inner = inner;
      } else {
        parent.inner = null;
      }
    }

    const singleton = s.match(singlePattern);

    if (singleton && singleton?.groups) {
      const { attrs, open } = singleton.groups;

      if (allowedElements.indexOf(open as Kind) < 0) {
        throw new Error();
      }

      parent.kind = open as Kind;

      parent.inner = null;
    }

    throw new Error("invalid body!");
  };
};

const extractAttributes = (kind: Kind, s: string) => {
  const map = attributeMap[kind];

    if (!map) {
      return null;
    }

  return s.split(" ").reduce((init, kv) => {
    const [k, v] = kv.replace(`"`, "").split("=");

    if (map.indexOf(k) < 0) {
      return init;
    }

    return { ...init, [k]: v };
  }, {});
}

