import { useContext, useEffect, useState } from "react";
import { RoomContext } from "../providers/room";

const Spinner = () => {
  const roomState = useContext(RoomContext);
  const [content, setContent] = useState("");

  const divStyle =
    "absolute ring-[4px] ring-violet-500/100 rounded-full animate-ping";
  const [roomEventsLength, roomLength] =
    roomState && roomState.rooms
      ? [Object.entries(roomState.roomEvents).length, roomState.rooms.length]
      : [null, null];

  // leave until later
  useEffect(() => {
    console.log(roomState, roomState?.rooms);
    roomState && roomState.rooms
      ? roomEventsLength && roomLength && roomEventsLength !== roomLength
        ? setContent(`loading messages ... ${roomEventsLength}/${roomLength}`)
        : setContent(`loading rooms ...`)
      : setContent("starting client ...");
  }, [content]);

  // useEffect(() => {
  //   const f = (content: string) =>
  //         content.search("...")
  //           ? content.replace("...", ".. ")
  //           : content.search(".. ")
  //           ? content.replace(".. ", " ..")
  //           : content.replace(" ..", "...");

  //     setTimeout(() => {
  //       console.log("new timeout")
  //       setContent(f(content));
  //       setTimeout(() => setContent(f(content)));
  //     }, 500);
  // }, []);

  return (
    <div className="">
      <div className="relative flex flex-col justify-center items-center h-screen w-screen">
        <div className="inline-block w-[72px] h-[72px] ripple">
          <div className={divStyle}></div>
          <div className={divStyle}></div>
        </div>
        <p className="text-transparent bg-clip-text bg-gradient-to-b from-slate-600 to-slate-800 font-bold">
          {content}
        </p>
      </div>
    </div>
  );
};

export default Spinner;
