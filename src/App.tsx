import { useContext, useEffect } from "react";
import Home from "./Home";
import Login from "./components/Login"
import { ClientContext } from "./providers/client";
import { createClient } from "matrix-js-sdk";
import Sidebar from "./components/Sidebar";

const App = () => {
  const { client, setClient } = useContext(ClientContext)!;
  const session = localStorage.getItem("session");

  // useEffect(() => {
  //   if (session && !client) {
  //     const { accessToken, baseUrl, user } = JSON.parse(session) as Session;
  //     const client = createClient({ accessToken, baseUrl, userId: user });

  //     setClient(client);
  //   }
  // })

    // {session ? <Home /> : <Login /> }
  return (
    <div className="flex">
      <Sidebar />
    </div>
  )
}

export default App
