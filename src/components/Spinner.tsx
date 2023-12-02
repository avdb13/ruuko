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
    roomState && roomState.rooms
      ? roomEventsLength && roomLength
        ? roomEventsLength !== roomLength
          ? setContent(`loading messages ... ${roomEventsLength}/${roomLength}`)
          : setContent(`nearly done ...`)
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
    <div className="h-screen w-screen">
      <div className="z-0 w-[108px] h-[108px] ripple">
        <div className={divStyle}></div>
        <div className={divStyle}></div>
      </div>
      <div className="flex flex-col justify-center h-screen">
        <p
          className="z-10 w-full text-zinc-600 duration-500 text-center bg-white py-12 font-bold"
          style={{ background: "linear-gradient(#FFF0, #FFFF, #FFFF, #FFF0)" }}
        >
          {content}
        </p>
      </div>
      <button className="text-center">logout</button>
    </div>
  );
};

export default Spinner;
