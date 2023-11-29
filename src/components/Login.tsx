import { SyntheticEvent, useEffect, useRef, useState } from "react";
import matrix from "../lib/matrix";
import { useCookies } from "react-cookie";
import axios from "axios";
import { tldExists } from "tldjs";

const Login = () => {
  const [_cookies, setCookie] = useCookies(["session"]);
  const [validUrl, setValidUrl] = useState<boolean | null>(null);
  const [server, setServer] = useState("");

  const serverRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const testServer = async () => {
    const versions = await axios.get(
      `https://${server}/_matrix/client/versions`,
    );
    // const well_known = await axios.get(
    //   `https://${server}/.well-known/matrix/client`,
    // );

    return versions.status === 200;
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    if (usernameRef.current && passwordRef.current) {
      const session = await matrix.login(
        server,
        usernameRef.current.value,
        passwordRef.current.value,
      );

      setCookie("session", session, { path: "/" });
    } else {
      console.log("missing fields");
    }
  };

  useEffect(() => {
    if (server.indexOf(".") > 0 && tldExists(server)) {
      testServer().then((res) => setValidUrl(res));

      if (validUrl) {
        setTimeout(() => {
          serverRef.current?.click();
        }, 500);
      }
    }
  }, [server]);

  const color =
    validUrl === null ? "" : validUrl ? "border-green-200" : "border-red-200";

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex justify-center items-center h-screen w-screen duration-300 ${
        validUrl ? "-translate-x-[200px] opacity-0" : ""
      }`}
    >
      <div className="basis-72 flex flex-col justify-center items-center gap-1">
        <label className="px-2 w-full text-sm text-gray-600 font-semibold">
          server
        </label>
        <input
          className={`duration-300 transition-all w-full basis-4 border-4 border-gray-400 focus:outline-none focus:border-4 focus:border-gray-600 rounded-md p-2 shadow-md ${color}`}
          type="text"
          ref={serverRef}
          value={server}
          onChange={(e) => setServer(e.target.value)}
        />
        <button
          onClick={testServer}
          className="w-1/2 basis-8 bg-transparent border-4 border-gray-400 mt-2 font-semibold text-gray-600 shadow-md rounded-md"
          type="submit"
        >
          next
        </button>
      </div>
    </form>
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
