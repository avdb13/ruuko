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

type Kind = keyof typeof atrributeMap | (typeof allowed)[number];

type HtmlElement = {
  kind: Kind;
  atrributes: Record<string, string>;
  inner: string | HtmlElement;
  before: string;
  after: string;
};

const FormattedBodyParser = (s: string) => {
  const maxDepth = 3;

  const nestedPattern =
    /<(?<open>[\S]+)\s?(?<attrs>.+)>(?<body>.+)<\/(?<close>[\S]+)>/;
  const singlePattern = /<(?<open>[\S]+)\s?(?<attrs>.+)\/>/;

  const txt =
    'normal text <span data-mx-spoiler="reason">spoiler content</span> more normal text';
  const reversed = s.split("").toReversed().join("");

  let start = 0;
  let end = s.length;

  const recurse = (parent: HtmlElement) => {
    const before = s.search("<");
    if (before !== -1) {
      start += before;
      parent.before = s.slice(0, before - 1);
    }

    const after = reversed.search(">");
    if (after !== -1) {
      end -= after;
      parent.after = s.slice(end + 1);
    }

    const nesting = s.slice(start, end).match(nestedPattern);

    if (nesting && nesting.groups) {
      if (nesting.groups["open"] !== nesting.groups["close"]) {
        throw new Error()
      }

      const inner = nesting.groups["body"]?.match(/.*[<>].*/) ? recurse(nesting.groups["body"]) : nesting.groups["body"];
      parent.inner = inner;
    }

    const singleton = s.slice(start, end).match(singlePattern);

    if (singleton) {
    }

    throw new Error("invalid body!");
  };

  // if (end < start) {
  //   return;
  // }
};
