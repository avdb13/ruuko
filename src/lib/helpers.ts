import axios from "axios";
import { MatrixClient } from "matrix-js-sdk";

export const extractAttributes = (
  s: string,
  attributes: Array<string>,
): Map<string, string> => {
  const matches = attributes.map((a) => {
    const match = s.match(new RegExp(`${a}s*=s*"(.+?)"`));

    return match ? (match.every((m) => !!m) ? [a, match[1]!] : null) : null;
  });

  return matches.every((m) => !!m) ? new Map(matches) : null;
};

interface TagContents {
  in_reply_to: string;
  message: string;
}

// keeping it easy for now, will see about adding the formatted body later
export const extractTags = (s: string): TagContents | null => {
  const end = s.lastIndexOf(">");
  const message = [...s].slice(end + 1).join("");
  const quote = [...s]
    .slice(0, end)
    .join("")
    .match(/<blockquote>(.*?)<\/blockquote>/);

  if (!quote || !quote[1]) {
    return null;
  }

  const in_reply_to = [...quote[1]]
    .slice(quote[1].lastIndexOf(">") + 1)
    .join("");

  return quote ? { message, in_reply_to } : null;
};

export const mxcUrlToHttp = (client: MatrixClient, url: string) => {
  const original = client.mxcUrlToHttp(url, 80, 80, "scale", true);

  // return axios.get(original).then(_ => original).catch(_ => original!.replace(client.baseUrl, "matrix.org"))
  return original!.replace(client.baseUrl, "https://matrix.org")
};
