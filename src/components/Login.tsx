import React, { useRef, useState } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import matrix, { Credentials } from "../lib/matrix";
import ArrowIcon from "./icons/Arrow";
import CrossIcon from "./icons/Cross";
import OfflineIcon from "./icons/Offline";
import Alert from "./Alert";

type baseUrlState = "disconnected" | "valid" | "invalid";

// TODO: make sure we get logged out when the token is invalid

const Login = () => {
  const [credentials, setCredentials] = useState<Credentials>(
    {} as Credentials,
  );
  const [error, setError] = useState<string | null>(
    null
  );

  return (
    <div className="relative h-max w-max bg-[#222] fade overflow-hidden">
      <Alert error={error} setError={setError} />
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

      <div className="flex justify-center items-center h-screen w-screen duration-300">
        {credentials.baseUrl ? (
          <FinalForm
            credentials={credentials}
            setCredentials={setCredentials}
            setError={setError}
          />
        ) : (
          <ServerForm
            credentials={credentials}
            setCredentials={setCredentials}
          />
        )}
      </div>
    </div>
  );
};

const FinalForm = ({
  credentials,
  setCredentials,
  setError,
}: {
  credentials: Credentials;
  setCredentials: (_: Credentials) => void;
  setError: (_: string | null) => void;
}) => {
  const [_cookies, setCookie] = useCookies(["session"]);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (passwordRef.current && usernameRef.current) {
      matrix
        .login({
          baseUrl: credentials.baseUrl,
          password: passwordRef.current.value,
          username: usernameRef.current.value,
        })
        .then((session) => setCookie("session", session, { path: "/" }))
        .catch(e => setError(e instanceof Error ? e.message : "an unknown error happened"))
      ;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="final-form gap-2 p-2 bg-blue-50 border-b-4 border-gray-500 shadow-xl rounded-md basis-80 flex flex-col justify-center items-center gap-1 duration-300 transition-all z-10"
    >
      <input
        className="placeholder:font-semibold w-full border-4 basis-8 border-gray-300 focus:border-gray-500 outline-none invalid:border-red-400 rounded-md p-2 shadow-md duration-300 transition-all"
        placeholder={`username (bob:${credentials.baseUrl.substring(
          "https://".length,
        )})`}
        type="text"
        ref={usernameRef}
      />
      <input
        placeholder="password"
        className="placeholder:font-semibold w-full border-4 basis-8 border-gray-300 focus:border-gray-500 outline-none invalid:border-red-400 rounded-md p-2 shadow-md duration-300 transition-all"
        type="password"
        ref={passwordRef}
      />
      <button
        type="submit"
        className="duration-300 transition-all group hover:border-gray-500 flex justify-center w-full shadow-md basis-8 p-2 mt-2 shadow-md border-4 border-gray-300 rounded-md bg-white"
      >
        <ArrowIcon class="duration-300 transition-all text-red-500 group-hover:text-gray-500 fill-current" />
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

  const testServer = async () => {
    if (!window.navigator.onLine) {
      return "disconnected";
    }

    try {
      await axios.get(`https://matrix.org/_matrix/client/versions`, {
        timeout: 2000,
      });
    } catch (e) {
      return "disconnected";
    }

    try {
      const resp = await axios.get(
        baseUrl.startsWith("https://")
          ? baseUrl + "/_matrix/client/versions"
          : "https://" + baseUrl + "/_matrix/client/versions",
        { timeout: 2000 },
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
        setCredentials({
          ...credentials,
          baseUrl: baseUrl.startsWith("https://")
            ? baseUrl
            : `https://${baseUrl}`,
        });
      }, 300);
    }
  };

  return (
    <form
      className={`server-form duration-300 transition-all ease-out basis-80 border-b-4 border-gray-400 bg-blue-50 p-2 rounded-md shadow-xl flex justify-center gap-2 z-10 ${
        state === "valid"
          ? "scale-50 blur-[4px] opacity-0"
          : "scale-1 blur-0 opacity-100"
      }`}
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        placeholder="server"
        className="placeholder:font-semibold w-full border-4 text-gray-600 border-gray-300 focus:border-gray-500 outline-none invalid:border-red-400 rounded-md p-2 shadow-md duration-300 transition-all"
        type="text"
        pattern="(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?"
        value={baseUrl}
        onChange={(e) => setServer(e.target.value)}
      />
      <button
        type="submit"
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
    </form>
  );
};

export default Login;
