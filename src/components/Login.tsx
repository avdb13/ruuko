import { SyntheticEvent, useRef } from "react";

const Login = () => {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();

    console.log(usernameRef.current?.value, passwordRef.current?.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>username </label>
        <input type="text" ref={usernameRef} />
      </div>
      <div>
        <label>password </label>
        <input type="password" ref={passwordRef} />
      </div>
    </form>
  );
};

export default Login;
