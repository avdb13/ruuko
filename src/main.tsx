import "matrix-js-sdk/lib/browser-index.d.ts";
import ReactDOM from "react-dom/client";
import "./index.css";
import ClientProvider from "./providers/client.tsx";
import { CookiesProvider } from "react-cookie";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <CookiesProvider>
    <ClientProvider />
  </CookiesProvider>,
);
