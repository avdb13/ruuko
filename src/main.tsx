import "matrix-js-sdk/lib/browser-index.d.ts";
import ReactDOM from "react-dom/client";
import "./index.css";
import ClientProvider from "./providers/client.tsx";
import { CookiesProvider } from "react-cookie";
import App from "./App.tsx";
import RoomProvider from "./providers/room.tsx";
import SettingsProvider from "./providers/settings.tsx";
import "@matrix-org/olm";
import Background from "./components/Background.tsx";
import InputProvider from "./providers/input.tsx";
import { StrictMode } from "react";

global.Olm = Olm;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Background>
    <CookiesProvider>
      <ClientProvider>
        <SettingsProvider>
          <RoomProvider>
            <InputProvider>
              <App />
            </InputProvider>
          </RoomProvider>
        </SettingsProvider>
      </ClientProvider>
    </CookiesProvider>
  </Background>,
);
