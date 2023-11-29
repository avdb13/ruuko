import { useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import { tldExists } from "tldjs";

type Credentials = {
  server: string;
  username: string;
  password: string;
};

type serverState = "disconnected" | "valid" | "invalid";

const Login = () => {
  const [credentials, setCredentials] = useState<Credentials>({} as Credentials);
  const [_cookies, setCookie] = useCookies(["session"]);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  return <ServerForm credentials={credentials} setCredentials={setCredentials} />;
};

const ServerForm = ({
  credentials,
  setCredentials,
}: {
  credentials: Credentials,
  setCredentials: (_: Credentials) => void;
}) => {
  const [server, setServer] = useState("");
  const [state, setState] = useState<serverState | null>(null);
  const serverRef = useRef<HTMLInputElement>(null);

  const testServer = async () => {
    try {
      await axios.get(`https://matrix.org/_matrix/client/versions`);
    } catch (e) {
      return "disconnected";
    }

    try {
      const resp = await axios.get(`https://${server}/_matrix/client/versions`);

      if (resp.status === 200) {
        return "valid";
      }
    } catch (e) {}

    return "invalid";
  };

  useEffect(() => {
    if (server.indexOf(".") > 0 && tldExists(server)) {
      testServer().then((status) => {
        console.log(status);
        setState(status);

        if (status === "valid") {
          setCredentials({...credentials, server });
          setTimeout(() => {
            serverRef.current?.click();
          }, 500);
        }
      });
    }
  }, [server]);

  return (
    <div
      className={`flex justify-center items-center h-screen w-screen duration-300 ${
        state === "valid"
          ? "-translate-x-[200px] opacity-0"
          : state === "invalid"
          ? "animation-pulse"
          : null
      }`}
    >
      <div
        className={`basis-72 flex flex-col justify-center items-center gap-1`}
      >
        <label className="px-2 w-full text-sm text-gray-600 font-semibold">
          server
        </label>
        <input
          className={`duration-300 placeholder:opacity-0 transition-all w-full basis-4 border-4 border-gray-400 focus:outline-none focus:border-4 focus:border-gray-600 rounded-md p-2 shadow-md ${
            state === null
              ? ""
              : state === "valid"
              ? "border-green-400"
              : state === "invalid"
              ? "border-red-400"
              : "border-red-400 placeholder:opacity-100"
          }`}
          type="text"
          ref={serverRef}
          value={server}
          onChange={(e) => setServer(e.target.value)}
        />
        <button onClick={testServer} className="invisible" type="submit">
          next
        </button>
      </div>
    </div>
  );
};

export default Login;

// <div>
//   <label className="block text-left">username</label>
//   <input className="h-8" type="text" ref={usernameRef} />
// </div>
// <div>
//   <label className="block text-left">password</label>
//   <input className="h-8" type="password" ref={passwordRef} />
// </div>
