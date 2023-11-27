import { useContext } from "react";
import { RoomContext } from "../providers/room";

const Spinner = () => {
  const divStyle =
    "absolute ring-[4px] ring-violet-500/100 rounded-full animate-ping";
  const roomState = useContext(RoomContext);
  const [roomEventsLength, roomLength] = roomState
    ? [Object.entries(roomState.roomEvents).length, roomState.rooms.length]
    : [null, null];
  const content = roomState
            ? roomLength === 0
              ? "loading rooms ..."
              : roomEventsLength !== roomLength
              ? `loading messages ... ${roomEventsLength}/${roomLength}`
              : "nearly done ..."
            : "starting client ...";

  // setTimeout(() => {
  //   setTimeout(() => {
  //       content.replace("...", ".. ");
  //       content.replace(".. ", " ..");
  //       content.replace(" ..", "...");
  //   }, 500)
  // }, 60*60)

  return (
    <div className="flex">
      <div className="relative flex flex-col justify-center items-center h-screen w-screen translate-x-[-36px] translate-y-[-36px]">
        <div className="relative inline-block w-[72px] h-[72px] ripple">
          <div className={divStyle}></div>
          <div className={divStyle}></div>
        </div>
        <p className="absolute top-[60%] text-transparent bg-clip-text bg-gradient-to-b from-slate-600 to-slate-800 font-bold">
          {content}
        </p>
      </div>
    </div>
  );
};

export default Spinner;
