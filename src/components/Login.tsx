import React, { useRef, useState } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import matrix from "../lib/matrix";
import ArrowIcon from "./icons/Arrow";
import Alert, { IconType } from "./Alert";

// TODO: make sure we get logged out when the token is invalid

const Login = () => {
  const [baseUrl, setBaseUrl] = useState<string>(
    ""
  );
  const [error, setError] = useState<{
    message: string;
    icon: IconType;
  } | null>(null);

  return (
    <>
      <Alert error={error} setError={setError} />

      <div className="flex justify-center items-center h-screen w-screen duration-300">
        {baseUrl ? (
          <FinalForm
            baseUrl={baseUrl}
            setError={setError}
          />
        ) : (
          <ServerForm
            baseUrl={baseUrl}
            setBaseUrl={setBaseUrl}
            setError={setError}
          />
        )}
      </div>
    </>
  );
};

const FinalForm = ({
  baseUrl,
  setError,
}: {
  baseUrl: string;
  setError: (_: { message: string; icon: IconType } | null) => void;
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
          baseUrl: baseUrl,
          password: passwordRef.current.value,
          username: usernameRef.current.value,
        })
        .then((session) => setCookie("session", session, { path: "/" }))
        .catch((e) =>
          setError({
            message:
              e instanceof Error ? e.message : "an unknown error happened",
            icon: "warning",
          }),
        );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="final-form gap-2 p-2 bg-blue-50 border-b-4 border-gray-500 shadow-xl rounded-md basis-80 flex flex-col justify-center items-center gap-1 duration-300 transition-all z-10"
    >
      <input
        className="placeholder:font-semibold w-full border-4 basis-8 border-gray-300 focus:border-gray-500 outline-none invalid:border-red-400 rounded-md p-2 shadow-md duration-300 transition-all"
        placeholder={`username`}
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
  setBaseUrl,
  setError,
}: {
  baseUrl: string;
  setBaseUrl: (_: string) => void;
  setError: (_: { message: string; icon: IconType } | null) => void;
}) => {
  const serverRef = useRef<HTMLInputElement>(null);
  const server = serverRef.current?.value;
  const [ok, setOk] = useState<boolean>(false);

  const testServer = async () => {
    if (!server) {
      return false;
    }

    if (!window.navigator.onLine) {
      setError({
        message: "you appear to be disconnected",
        icon: "disconnected",
      });
      return false;
    }

    try {
      await axios.get(`https://matrix.org/_matrix/client/versions`, {
        timeout: 2000,
      });
    } catch (e) {
      setError({
        message: "you appear to be disconnected",
        icon: "disconnected",
      });
      return false;
    }

    try {
      const resp = await axios.get(
        server.startsWith("https://")
          ? server + "/_matrix/client/versions"
          : "https://" + server + "/_matrix/client/versions",
        { timeout: 2000 },
      );

      if (resp.status === 200) {
        return true;
      }
    } catch (e) {}

    setError({
      message: "please specify a valid server URL",
      icon: "disconnected",
    });
    return false;
  };

  const handleClick = async () => {
    const status = await testServer();

    if (status && server) {
      setOk(true);

      setTimeout(() => {
        setBaseUrl(
          server.startsWith("https://")
            ? server
            : `https://${server}`
        );
      }, 300);
    }
  };

  return (
    <form
      className={`server-form duration-300 transition-all ease-out basis-80 border-b-4 border-gray-400 bg-blue-50 p-2 rounded-md shadow-xl flex justify-center gap-2 z-10 ${
        ok ? "scale-50 blur-[4px] opacity-0" : "scale-1 blur-0 opacity-100"
      }`}
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        ref={serverRef}
        placeholder="server"
        className="placeholder:font-semibold w-full border-4 text-gray-600 border-gray-300 focus:border-gray-500 outline-none invalid:border-red-400 rounded-md p-2 shadow-md duration-300 transition-all"
        type="text"
        pattern="(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?"
      />
      <button
        type="submit"
        onClick={handleClick}
        className={`border-gray-300 hover:border-gray-500 group rounded-md basis-16 bg-white border-4 shadow-md flex justify-center items-center duration-300 transition-all`}
      >
        <ArrowIcon class="duration-300 transition-all text-gray-300 group-hover:text-gray-500 fill-current" />
      </button>
    </form>
  );
};

export default Login;
