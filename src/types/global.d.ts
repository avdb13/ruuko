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
}
