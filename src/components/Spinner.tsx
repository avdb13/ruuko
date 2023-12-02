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
    console.log(
      !!roomState,
      roomState?.rooms?.length,
      roomEventsLength,
      roomLength,
    );
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
    <div className="">
      <div className="relative flex flex-col justify-center items-center h-screen w-screen">
        <div className="w-[108px] h-[108px] ripple">
          <div className={divStyle}></div>
          <div className={divStyle}></div>
        </div>
        <p
          className="z-10 text-zinc-600 duration-500 text-center bg-white py-12 w-full font-bold"
          style={{ background: "linear-gradient(#FFF0, #FFFF, #FFFF, #FFF0)" }}
        >
          {content}
        </p>
      </div>
    </div>
  );
};

export default Spinner;
