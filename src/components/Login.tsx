import { useRef, useState } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import matrix, { Credentials } from "../lib/matrix";
import ArrowIcon from "./icons/Arrow";
import CrossIcon from "./icons/Cross";
import OfflineIcon from "./icons/Offline";

type baseUrlState = "disconnected" | "valid" | "invalid";

// TODO: make sure we get logged out when the token is invalid

const Login = () => {
  const [credentials, setCredentials] = useState<Credentials>(
    {} as Credentials,
  );

  return (
    <div className="h-max w-max bg-[#222] overflow-hidden">
      <div
        className="chip"
        style={{
          background: "linear-gradient(#855afc, #3ac8fc)",
          filter: "hue-rotate(-15deg) blur(60px)",
          translate: "10% 20%",
          scale: "120%",
          rotate: "45deg",
          borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
        }}
      ></div>
      <div
        className="chip"
        style={{
          background: "linear-gradient(#855afc, #3ac8fc)",
          filter: "hue-rotate(15deg) blur(60px)",
          scale: "140%",
          translate: "-10% -20%",
          borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          opacity: "40%",
          filter: "blur(100px)",
          inset: "0",
          background: "radial-gradient(ellipse at top, #f8f8ff00, #000F)",
          height: "100%",
          width: "100%",
        }}
      ></div>
      <div
        id="filler"
        className="absolute inset-0 h-full w-full bg-[#222]"
      ></div>

      {credentials.baseUrl ? (
        <FinalForm credentials={credentials} setCredentials={setCredentials} />
      ) : (
        <ServerForm credentials={credentials} setCredentials={setCredentials} />
      )}
    </div>
  );
};

const FinalForm = ({
  credentials,
  setCredentials,
}: {
  credentials: Credentials;
  setCredentials: (_: Credentials) => void;
}) => {
  const [_cookies, setCookie] = useCookies(["session"]);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (passwordRef.current && usernameRef.current) {
          matrix
            .login({
              baseUrl: credentials.baseUrl,
              password: passwordRef.current.value,
              username: usernameRef.current.value,
            })
            .then((session) => setCookie("session", session, { path: "/" }));
        }
      }}
      className="bg-transparent basis-72 flex flex-col justify-center items-center gap-1 h-screen w-screen opacity-0 -delay-500 duration-300 transition-all"
    >
      <div>
        <label className="px-2 w-full text-sm text-gray-500 font-semibold">
          username
        </label>
        <input
          className="duration-300 placeholder:opacity-0 transition-all w-full basis-4 border-4 border-gray-400 focus:outline-none focus:border-4 focus:border-gray-500 rounded-md p-2 shadow-md"
          placeholder="disconnected"
          type="text"
          ref={usernameRef}
        />
      </div>
      <div>
        <label className="px-2 w-full text-sm text-gray-500 font-semibold">
          password
        </label>
        <input
          className="duration-300 placeholder:opacity-0 transition-all w-full basis-4 border-4 border-gray-400 focus:outline-none focus:border-4 focus:border-gray-500 rounded-md p-2 shadow-md"
          type="password"
          ref={passwordRef}
        />
      </div>
      <button type="submit" className="invisible"></button>
      <button
        type="button"
        className="w-24 font-bold text-white shadow-md my-2 py-2 rounded-md bg-gray-400"
        onClick={() => setCredentials({} as Credentials)}
      >
        back
      </button>
    </form>
  );
};

const ServerForm = ({
  credentials,
  setCredentials,
}: {
  credentials: Credentials;
  setCredentials: (_: Credentials) => void;
}) => {
  const [baseUrl, setServer] = useState("");
  const [state, setState] = useState<baseUrlState | null>(null);
  const baseUrlRef = useRef<HTMLInputElement>(null);

  const testServer = async () => {
    console.log(baseUrl);

    if (!window.navigator.onLine) {
      return "disconnected";
    }

    try {
      await axios.get(`https://matrix.org/_matrix/client/versions`);
    } catch (e) {
      return "disconnected";
    }

    try {
      const resp = await axios.get(
        baseUrl.startsWith("https://")
          ? baseUrl + "/_matrix/client/versions"
          : "https://" + baseUrl + "/_matrix/client/versions",
      );

      if (resp.status === 200) {
        return "valid";
      }
    } catch (e) {}

    return "invalid";
  };

  const handleClick = async () => {
    const status = await testServer();
    setState(status);

    if (status === "valid") {
      setTimeout(() => {
        baseUrlRef.current?.click();
        setCredentials({
          ...credentials,
          baseUrl: baseUrl.startsWith("https://")
            ? baseUrl
            : `https://${baseUrl}`,
        });
      }, 500);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen w-screen duration-300">
      <div
        className="relative basis-80 border-b-4 border-gray-400 bg-blue-50 p-2 rounded-md shadow-xl flex justify-center gap-2"
        id="server-input"
      >
        <input
          placeholder="server"
          className="placeholder:opacity-100 placeholder:font-semibold w-full border-4 border-gray-300 focus:border-gray-500 outline-none invalid:border-red-400 rounded-md p-2 shadow-md duration-300 transition-all"
          type="text"
          pattern="(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?"
          ref={baseUrlRef}
          value={baseUrl}
          onChange={(e) => setServer(e.target.value)}
        />
        <button
          title={`${state ? state : "next"}`}
          onClick={handleClick}
          className={`group rounded-md basis-16 bg-white border-4 shadow-md flex justify-center items-center duration-300 transition-all ${
            state && state !== "valid"
              ? "border-red-300 hover:border-red-500"
              : "border-gray-300 hover:border-gray-500"
          }`}
        >
          {!state ? (
            <ArrowIcon class="duration-300 transition-all text-gray-300 group-hover:text-gray-500 fill-current" />
          ) : null}
          {state === "invalid" ? (
            <CrossIcon class="duration-300 transition-all text-red-300 group-hover:text-red-500 fill-current" />
          ) : null}
          {state === "disconnected" ? (
            <OfflineIcon class="duration-300 transition-all text-red-300 group-hover:text-red-500 fill-current" />
          ) : null}
        </button>
      </div>
    </div>
  );
};

export default Login;
