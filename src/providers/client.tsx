import { EventEmitterEvents, IndexedDBStore, MatrixClient, MatrixEvent, MatrixEventEvent, SyncState, createClient } from "matrix-js-sdk";
import {
  PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";
import Spinner from "../components/Spinner";
import Login from "../components/Login";
import { useCookies } from "react-cookie";

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
  return createClient({ accessToken, baseUrl, userId: user, store });
};

const ClientProvider = (props: PropsWithChildren) => {
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [cookies] = useCookies(["session"]);
  const session = cookies["session"] as Session;

  useEffect(() => {
    if (cookies["session"]) {
      const client = initClient(session);
      setClient(client);

      client.startClient({ lazyLoadMembers: true });
    }
  }, [cookies, session]);

  if (!cookies["session"] && !client) {
    return <Login />;
  } else if (!client) {
    return <Spinner />;
  }


  return (
    <ClientContext.Provider value={client}>{props.children}</ClientContext.Provider>
  );

};

export default ClientProvider;
