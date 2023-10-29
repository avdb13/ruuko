import { useContext, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";

const Home = ({ messages }: { messages: string[] }) => {
  // <p>{room.getLiveTimeline().getState(Direction.Forward)?.getMembers()!}</p>
  return (
    <div>
      <Sidebar />
      <ul>
      </ul>
      <ul>
        {messages.map(m => <li>{m}</li>)}
      </ul>
    </div>
  )
};

export default Home;
