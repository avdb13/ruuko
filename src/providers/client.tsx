import {
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

const initClient = async (session: Session) => {
  console.log("create store")
  const store = new IndexedDBStore({
    indexedDB: globalThis.indexedDB,
    localStorage: globalThis.localStorage,
    dbName: "ruuko",
  });

  await store.startup();
  console.log("success creating store")

  const { accessToken, baseUrl, user } = session;

  return createClient({
    accessToken,
    baseUrl,
    userId: user,
    deviceId: "Ruuko (beta)",
    store,
    timelineSupport: true,
  });
};

const ClientProvider = (props: PropsWithChildren) => {
  const [client, setClient] = useState<MatrixClient | null>(null);

  const [cookies] = useCookies(["session"]);
  const session = cookies["session"] as Session;

  // TODO: encryption
  useEffect(() => {
    if (cookies["session"]) {
      const f = async () => {
        try {
          const client = await initClient(session);

          const filter = await client.createFilter({
            presence: { not_types: ["m.presence"] },
          });
          // await client.initCrypto();
          // console.log("initialized crypto");

          // console.log(import.meta.env.VITE_PASSWORD)
          // await client.uploadDeviceSigningKeys().catch();
          // await client.uploadDeviceSigningKeys({password: import.meta.env.VITE_PASSWORD,type:AuthType.Password,identifier:{user: import.meta.env.VITE_USERNAME},session: client.getSessionId()});

          await client.startClient({
            lazyLoadMembers: true,
            initialSyncLimit: 10,
            filter,
          });

          setClient(client);
        } catch (e) {
          console.error(e);
        }
      };

      f().then(() => {
        console.log("client ready");
      });
    }
  }, [session]);

  if (!cookies["session"] && !client) {
    return <Login />;
  }

  if (!client) {
    console.log("no client");
    return <LogoutButton />;
  }

  console.log("client ready");
  return (
    <ClientContext.Provider value={client}>
      {props.children}
    </ClientContext.Provider>
  );
};

export default ClientProvider;
