import { useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import { parse, tldExists } from "tldjs";
import matrix, { Credentials } from "../lib/matrix";

type baseUrlState = "disconnected" | "valid" | "invalid" | "loading";

// TODO: make sure we get logged out when the token is invalid

const Login = () => {
  const [credentials, setCredentials] = useState<Credentials>(
    {} as Credentials,
  );

  return (
    <div className="w-screen h-screen bg-[#222]">
      <div>
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
      </div>

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
      className={`bg-transparent basis-72 flex flex-col justify-center items-center gap-1 h-screen w-screen opacity-0 -delay-500 duration-300 transition-all ${
        credentials.baseUrl ? "-translate-x-[0px] opacity-100" : null
      }`}
    >
      <div>
        <label className="px-2 w-full text-sm text-gray-600 font-semibold">
          username
        </label>
        <input
          className="duration-300 placeholder:opacity-0 transition-all w-full basis-4 border-4 border-gray-400 focus:outline-none focus:border-4 focus:border-gray-600 rounded-md p-2 shadow-md"
          placeholder="disconnected"
          type="text"
          ref={usernameRef}
        />
      </div>
      <div>
        <label className="px-2 w-full text-sm text-gray-600 font-semibold">
          password
        </label>
        <input
          className="duration-300 placeholder:opacity-0 transition-all w-full basis-4 border-4 border-gray-400 focus:outline-none focus:border-4 focus:border-gray-600 rounded-md p-2 shadow-md"
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
    try {
      await axios.get(`https://matrix.org/_matrix/client/versions`);
    } catch (e) {
      return "disconnected";
    }

    try {
      const resp = await axios.get(
        `https://${baseUrl}/_matrix/client/versions`,
      );

      if (resp.status === 200) {
        return "valid";
      }
    } catch (e) {}

    return "invalid";
  };

  useEffect(() => {
    const split = baseUrl.split(".");
    if (split[1] && split[1].length > 1 && tldExists(baseUrl)) {
      setState("loading");

      testServer().then((status) => {
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
          }, 2000);
        }
      });
    }
  }, [baseUrl]);

  return (
    <div
      className={`flex justify-center items-center h-screen w-screen duration-300 ${
        state === "valid"
          ? "-translate-x-[200px] opacity-0 delay-1000"
          : state === "invalid"
          ? "animation-pulse"
          : null
      }`}
    >
      <div
        className={`relative basis-72 flex flex-col justify-center items-center gap-1`}
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
          ref={baseUrlRef}
          value={baseUrl}
          onChange={(e) => setServer(e.target.value)}
        />
        {state === "loading" ? (
          <div className="absolute left-[90px] bottom-[57.5px] lds-ellipsis scale-75 opacity-50"></div>
        ) : null}
        <button onClick={testServer} className="invisible">
          next
        </button>
      </div>
    </div>
  );
};

export default Login;
