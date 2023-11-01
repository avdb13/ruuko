import { SyntheticEvent, useEffect, useRef } from "react";
import matrix from "../lib/matrix";
import { useCookies } from "react-cookie";

const Login = () => {
  const [_, setCookie] = useCookies(["session"]);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const serverRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    if (serverRef.current && usernameRef.current && passwordRef.current) {
      const session = await matrix.login(
        serverRef.current.value,
        usernameRef.current.value,
        passwordRef.current.value,
      );

      setCookie("session", session, { path: "/" });
    } else {
      console.log("missing fields");
    }
  };

  return (
    <div className="flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center w-[400px] bg-green-100 mt-8 p-4"
      >
        <div>
          <label>server </label>
          <input type="text" ref={serverRef} />
        </div>
        <div>
          <label>username </label>
          <input type="text" ref={usernameRef} />
        </div>
        <div>
          <label>password </label>
          <input type="password" ref={passwordRef} />
        </div>
        <button type="submit">login</button>
      </form>
    </div>
  );
};

export default Login;
