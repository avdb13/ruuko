import "matrix-js-sdk/lib/browser-index.d.ts";
import "./index.css";
import ClientProvider from "./providers/client.tsx";
import { CookiesProvider } from "react-cookie";
import App from "./App.tsx";
import RoomProvider from "./providers/room.tsx";
import SettingsProvider from "./providers/settings.tsx";
import "@matrix-org/olm";
import Background from "./components/Background.tsx";
import InputProvider from "./providers/input.tsx";
import ReactDOM from "react-dom/client";
import AvatarProvider from "./providers/avatar.tsx";
import AuthProvider from "./providers/authentication.tsx";

global.Olm = Olm;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Background>
    <CookiesProvider>
      <ClientProvider>
        <AuthProvider>
          <SettingsProvider>
            <RoomProvider>
              <AvatarProvider>
                <InputProvider>
                  <App />
                </InputProvider>
              </AvatarProvider>
            </RoomProvider>
          </SettingsProvider>
        </AuthProvider>
      </ClientProvider>
    </CookiesProvider>
  </Background>,
);
