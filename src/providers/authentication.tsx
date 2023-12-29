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
};

export type Device = {
  details: IMyDevice;
  verificationStatus: DeviceVerificationStatus | null;
};

export const AuthContext = createContext<AuthState>({ devices: null });

const AuthProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);
  const crypto = client.getCrypto();
  const me = client.getUserId()!;

  const [devices, setDevices] = useState<Device[] | null>(null);

  useEffect(() => {
    crypto?.requestOwnUserVerification();

    if (crypto) {
      client.getDevices().then((resp) => {
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
          // setSelected([...Array(devices.length).keys()].map(() => false));
        });
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ devices }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
