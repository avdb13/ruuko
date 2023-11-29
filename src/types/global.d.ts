import { MatrixEvent } from "matrix-js-sdk";

export {}

declare global {
  interface Session {
    accessToken: string,
    device: string,
    user: string,
    baseUrl: string,
  }


  interface ModalProps {
    toggleVisibility: () => void;
  }

  interface Metadata {
    name?: string;
    topic?: string;
    id: string;
    avatar_url?: string;
  }
}
