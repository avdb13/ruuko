import { SyntheticEvent, useContext, useRef } from "react";
import matrix from "../lib/matrix";
import { ClientContext } from "../providers/client";

const Notification = () => {
  return (
    <div>
      <p>oops</p>
    </div>
  );
};

const Login = () => {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const serverRef = useRef<HTMLInputElement>(null);

  const { setClient } = useContext(ClientContext)!;

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();

    console.log(usernameRef.current?.value, passwordRef.current?.value);

    if (serverRef.current && usernameRef.current && passwordRef.current) {
      matrix
        .login(
          serverRef.current.value,
          usernameRef.current.value,
          passwordRef.current.value,
        )
        .then((client) => setClient(client));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex">
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
  );
};

export default Login;
