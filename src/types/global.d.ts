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

  interface ExtendedEvent extends MatrixEvent {
    annotations?: MatrixEvent[];
  }
}
