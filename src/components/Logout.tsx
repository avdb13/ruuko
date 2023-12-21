import { useContext } from "react";
import { ClientContext } from "../providers/client";
import { useCookies } from "react-cookie";

const LogoutButton = ({className}: {className?: string}) => {
  const client = useContext(ClientContext);
  const [_cookies, _setCookie, removeCookie] = useCookies(["session"]);

  const handleLogout = () => {
    client.logout().then(() => {
      removeCookie("session");
    });
  };

  return (
    <button
      className={`welcome button absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-contrast-150 ${className}`}
      onClick={handleLogout}
    >
      <p className="logout uppercase font-bold p-2 border-4 text-xl bg-opacity-50 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)]">logout</p>
    </button>
  );
};

export default LogoutButton;
