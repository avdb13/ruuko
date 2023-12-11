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
    title: string;
    visible: boolean;
    setVisible: (_: boolean) => void;
  }

  interface Metadata {
    name?: string;
    topic?: string;
    id: string;
    avatar_url?: string;
  }

  interface EventRelations {
  }
}
