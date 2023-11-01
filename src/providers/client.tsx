import { MatrixClient, createClient } from "matrix-js-sdk";
import {
  PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";
import Spinner from "../components/Spinner";
import Login from "../components/Login";
import { useCookies } from "react-cookie";
import App from "../App";

const temporaryClient = () => {
  return createClient({ baseUrl: "https://matrix.org" });
};

export const ClientContext = createContext<MatrixClient>(temporaryClient());

const ClientProvider = (props: PropsWithChildren) => {
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [cookies] = useCookies(["session"]);

  useEffect(() => {
    if (cookies["session"]) {
      const { accessToken, baseUrl, user }: Session = cookies["session"];
      const client = createClient({ accessToken, baseUrl, userId: user });

      setClient(client);

      client.startClient({ initialSyncLimit: 10 });
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
