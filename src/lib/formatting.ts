// Tag 	  Permitted Attributes
// font 	data-mx-bg-color, data-mx-color, color
// span 	data-mx-bg-color, data-mx-color, data-mx-spoiler (see spoiler
// messages) a 	    name, target, href (provided the value is not relative and
// has a scheme matching one of: https, http, ftp, mailto, magnet) img width,
// height, alt, title, src (provided it is a Matrix Content (mxc://) URI) ol
// start code 	class (only classes which start with language- for syntax
// highlighting)
//

const allowed = [
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

const atrributeMap = {
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

type Kind = (typeof allowed)[number];

type HtmlElement = {
  kind: Kind;
  atrributes: Record<string, string>;
  inner: string | HtmlElement | null;
  before: string | null;
  after: string | null;
};

const isAllowed = (s: string): s is Kind => {
  return allowed.indexOf(s as Kind) >= 0;
}

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


      if (allowed.indexOf(open as Kind) < 0) {
        throw new Error()
      }

      parent.kind = open as Kind;

      if (open !== close) {
        throw new Error()
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

      if (allowed.indexOf(open as Kind) < 0) {
        throw new Error()
      }

      parent.kind = open as Kind;

      parent.inner = null;
    }

    throw new Error("invalid body!");
  };

};

const extractAttributes = (s: string) => s.split(" ").reduce((init, kv) => {
    const [k,v] = kv.split("=");

    return ({...init, [k]: v})
  }, {});
