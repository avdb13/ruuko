import { IndexedDBStore, MatrixClient, createClient } from "matrix-js-sdk";
import "@matrix-org/olm";
import {
  PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";
import { useCookies } from "react-cookie";
import Login from "../components/Login";

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
  return createClient({ accessToken, baseUrl, userId: user, deviceId: "Ruuko", store });
};

const ClientProvider = (props: PropsWithChildren) => {
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [cookies] = useCookies(["session"]);
  const session = cookies["session"] as Session;

  useEffect(() => {
    if (cookies["session"]) {
      const client = initClient(session);

      client.startClient({ initialSyncLimit: 4 })
      setClient(client);
    }
  }, [cookies, session]);

  if (!cookies["session"] && !client) {
    return <Login />;
  }

  if (!client) {
    return null;
  }


  return <ClientContext.Provider value={client}>{props.children}</ClientContext.Provider>
};

export default ClientProvider;
