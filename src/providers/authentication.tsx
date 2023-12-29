import { DeviceVerificationStatus, IMyDevice } from "matrix-js-sdk";
import { ClientContext } from "./client";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthState = {
  devices: Device[] | null;
  refreshDevices: (_: boolean) => void;
};

export type Device = {
  details: IMyDevice;
  verificationStatus: DeviceVerificationStatus | null;
};

export const AuthContext = createContext<AuthState>({ devices: null, refreshDevices: () => {} });

const AuthProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);
  const crypto = client.getCrypto();
  const me = client.getUserId()!;

  const [devices, setDevices] = useState<Device[] | null>(null);
  const [refreshDevices, setRefreshDevices] = useState(true);

  useEffect(() => {
    // crypto?.requestOwnUserVerification();

    if (crypto && refreshDevices) {
      client.getDevices().then((resp) => {
        setRefreshDevices(false);

        const devices = resp.devices;
        Promise.all(
          devices.map((details) =>
            crypto.getDeviceVerificationStatus(me, details.device_id),
          ),
        ).then((statuses) => {
          setDevices(
            devices.map((details, i) => ({
              details,
              verificationStatus: statuses[i] ?? null,
            })),
          );
        });
      });
    }
  }, [refreshDevices]);

  return (
    <AuthContext.Provider value={{ devices, refreshDevices: () => setRefreshDevices(true) }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
