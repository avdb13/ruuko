import {
  Filter,
  IndexedDBStore,
  MatrixClient,
  createClient,
} from "matrix-js-sdk";
import "@matrix-org/olm";
import { PropsWithChildren, createContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import Login from "../components/Login";
import LogoutButton from "../components/Logout";

const temporaryClient = () => {
  return createClient({ baseUrl: "https://matrix.org" });
};

export const ClientContext = createContext<MatrixClient>(temporaryClient());

const initClient = (session: Session) => {
  const store = new IndexedDBStore({
    indexedDB: globalThis.indexedDB,
    localStorage: globalThis.localStorage,
    dbName: "ruuko",
  });

  store.startup();

  const { accessToken, baseUrl, user } = session;

  // is deviceId correct here?
  return createClient({
    accessToken,
    baseUrl,
    userId: user,
    deviceId: "Ruuko (beta)",
    store,
  });
};

const ClientProvider = (props: PropsWithChildren) => {
  const [client, setClient] = useState<MatrixClient | null>(null);

  const [cookies] = useCookies(["session"]);
  const session = cookies["session"] as Session;

  // TODO: encryption
  useEffect(() => {
    if (cookies["session"]) {
      const client = initClient(session);

      const f = async () => {
        try {
          const filter = await client.createFilter({
            presence: { not_types: ["m.presence"] },
          });
          await client.initCrypto();
          await client.uploadDeviceSigningKeys();

          client.startClient({
            lazyLoadMembers: true,
            initialSyncLimit: 10,
            filter,
          });
        } catch (e) {
          console.error(e);
        }
      };

      f().then(() => setClient(client));
    } else {
      setClient(null);
    }
  }, [cookies, session]);

  if (!cookies["session"] && !client) {
    return <Login />;
  }

  if (!client) {
    return <LogoutButton />;
  }

  return (
    <ClientContext.Provider value={client}>
      {props.children}
    </ClientContext.Provider>
  );
};

export default ClientProvider;
