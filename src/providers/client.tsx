import { IndexedDBStore, MatrixClient, createClient } from "matrix-js-sdk";
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

const initClient = (session: Session): MatrixClient => {
  const store = new IndexedDBStore({
    indexedDB: globalThis.indexedDB,
    localStorage: globalThis.localStorage,
    dbName: "ruuko",
  });

  const { accessToken, baseUrl, user } = session;
  return createClient({ accessToken, baseUrl, userId: user, store });
};

const ClientProvider = (props: PropsWithChildren) => {
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [cookies] = useCookies(["session"]);

  useEffect(() => {
    if (cookies["session"]) {
      const client = initClient(cookies["session"] as Session);
      setClient(client);

      client.startClient({ lazyLoadMembers: true });
    }
  }, [cookies]);

  if (!cookies["session"] && !client) {
    return <Login />;
  } else if (!client) {
    return <Spinner />;
  } else {
    // not sure whether this is good practice.
    return (
      <ClientContext.Provider value={client}>{props.children}</ClientContext.Provider>
    );
  }

};

export default ClientProvider;
