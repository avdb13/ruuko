import { MatrixClient } from "matrix-js-sdk";

export interface DisplayedMember {
  user_id: string;
  avatar_url?: string;
  display_name?: string;
}

// make this only trigger if no image can be loaded for the user's homeserver
export const fallbackMxcUrlToHttp = (client: MatrixClient, url?: string) => {
  const originalUrl = url
    ? client.mxcUrlToHttp(url, 80, 80, "scale", true) || ""
    : "";
  return originalUrl.replace("matrix.envs.net", "matrix.org");
};


