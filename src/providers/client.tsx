import { MatrixClient } from "matrix-js-sdk";
import React, { PropsWithChildren, createContext, useState } from "react";

interface Context {
  client: MatrixClient | null;
  setClient: (value: MatrixClient) => void;
}

export const ClientContext = createContext<Context | null>(null);

const ClientProvider = ({ children }: PropsWithChildren) => {
  const [client, setClient] = useState<MatrixClient | null>(null);

  return (
    <ClientContext.Provider
      value={{client, setClient}}
    >{children}</ClientContext.Provider>
  );
};

export default ClientProvider;
