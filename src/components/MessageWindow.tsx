import { EventType, MatrixEvent, RelationType, RoomState } from "matrix-js-sdk";
import MessageComponent, {
  DateMessage,
  Membership,
  MessageFrame,
  StateFrame,
} from "./Message";
import InputBar from "./InputBar";
import {
  lazy,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Message, RoomContext, sortByTimestamp } from "../providers/room";
import MembersIcon from "./icons/Members";
import { ClientContext } from "../providers/client";
import Loader from "./Loader";
import { AvatarContext } from "../providers/avatar";

const Modal = lazy(() => import("./Modal"));
const MemberList = lazy(() => import("./MemberList"));

// in case we have performance issues later
// type SortingMetadata = {
//   sender: string, timestamp: number, id: string,
// }

const MessageWindow = () => {
  // no idea why roomEvents doesn't contain replies.
  const {
    currentRoom,
    roomEvents,
    roomStates,
    setRoomEvents,
    scrolling,
    setScrolling,
  } = useContext(RoomContext)!;
  const client = useContext(ClientContext);
  const { ready, avatars } = useContext(AvatarContext)!;

  const bottomDivRef = useRef<HTMLUListElement>(null);
  const [showMembers, setShowMembers] = useState(false);

  if (!currentRoom) {
    return null;
  }

  const messages = roomEvents[currentRoom.roomId]!;
  const messageMemo = useMemo(() => {
    return messages;
  }, [currentRoom, messages]);

  useEffect(() => {
    lazyLoadEvents();
  }, [currentRoom.roomId]);

  const lazyLoadEvents = () => {
    const parent = bottomDivRef.current;

    if (!parent) {
      return;
    }

    const children = [...(parent.children ?? [])];
    const parentHeight = parent.getBoundingClientRect().height;

    if (children.length > 0) {
      const childrenHeight = children.map(
        (c) => c.getBoundingClientRect().height,
      );

      const range = [...Array(children.length).keys()];
      const accum = (i: number) =>
        childrenHeight.slice(0, i).reduce((init, j) => init + j, 0);

      const visibleEls = range.find(
        (i) => accum(i) - parent.scrollTop > parentHeight,
      );

      console.log(children.length, visibleEls);
      if (!visibleEls) {
        setScrolling(true);

        // assume this will automatically add new events to the timeline
        client.scrollback(currentRoom, 10).then((_) => {
          setScrolling(false);
        });
      }
    }
  };

  useLayoutEffect(() => {
    if (bottomDivRef.current) {
      bottomDivRef.current.addEventListener("scroll", lazyLoadEvents);

      return () => {
        bottomDivRef.current?.removeEventListener("scroll", lazyLoadEvents);
      };
    }
  }, [currentRoom.roomId, bottomDivRef]);

  if (currentRoom?.getMyMembership() === Membership.Ban) {
    return (
      <div className="relative basis-1/2 max-h-screen grow">
        <div className="absolute open:animate-modal modal w-[40%] border-2 border-indigo-50 bg-white shadow-md rounded-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-8">
          <p className="py-2 text-lg text-gray-800 font-bold text-center">
            you were banned from this room
          </p>
          <p className="py-2 text-center text-gray-800">
            reason:{" "}
            {messageMemo[messageMemo.length - 1]?.event.getContent().reason ??
              "unknown"}
          </p>
        </div>
      </div>
    );
  }

  if (!ready || currentRoom.getMembers().every((m) => avatars[m.userId])) {
    return (
      <div className="relative basis-1/2 h-screen grow">
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <Loader />
        </div>
      </div>
    );
  }

  // fix harsh transition
  return (
    <div className="min-w-0 flex grow">
      <div className="isolate min-w-0 flex flex-col basis-1/2 justify-between h-screen grow">
        <TitleBar
          showMembers={showMembers}
          setShowMembers={setShowMembers}
          roomState={roomStates[currentRoom.roomId] || null}
          roomName={currentRoom.name}
        />
        <ul
          ref={bottomDivRef}
          className="overflow-y-scroll scrollbar flex flex-col justify-start mt-auto scale-y-[-1] [&>*]:scale-y-[-1] [&>li]:list-none overflow-x-clip"
          id="bottom-div"
        >
          <Timeline messages={messageMemo} />
          {scrolling ? (
            <div className="h-24 shrink-0 flex items-center">
              <Loader className="bg-transparent w-full" />
            </div>
          ) : null}
        </ul>
        <InputBar roomId={currentRoom.roomId} />
      </div>
      <MemberList visible={showMembers} setVisible={setShowMembers} />
    </div>
  );
};

const Timeline = ({ messages }: { messages: Message[] }) => {
  // const { currentRoom, roomEvents } = useContext(RoomContext)!;
  // const { avatars } = useContext(AvatarContext)!;

  // const timestamps = sortByTimestamp(roomEvents[currentRoom!.roomId] ?? []);

  // return reply + event + annotations
  // const eventRecord = useMemo(
  //   () =>
  //     messages.reduce(
  //       (init, message) => ({
  //         ...init,
  //         [message.event.getId()!]: (
  //           <MessageComponent
  //             message={message}
  //           />
  //         ),
  //       }),
  //       {} as Record<string, JSX.Element>,
  //     ),
  //   [events.length],
  // );

  return [...Array(messages.length).keys()].map((i) => {
    const message = messages[messages.length - i - 1]!;

    return (
      <MessageFrame
        key={message.event.getId()!}
        userId={message.event.getSender()!}
        displayName={message.event.sender?.rawDisplayName}
        timestamp={message.event.getTs()}
      >
        <MessageComponent message={message} />
      </MessageFrame>
    );
  });

  // TODO: get rid of this filter and pinpoint the problem.
  // return sortedEvents.filter(arr => arr.length > 0).map((list, i) => {
  //   const firstEvent = currentRoom?.findEventById(list[0]!)!;

  //   const displayName = firstEvent.getContent().displayname;

  //   const previous =
  //     i !== 0
  //       ? currentRoom!.findEventById(sortedEvents[i - 1]?.[0] || "") ?? null
  //       : null;

  //   if (list.length === 1 && (firstEvent.getType() !== EventType.RoomMessage || firstEvent.getType() !== EventType.RoomMessageEncrypted)) {
  //     return (
  //       <>
  //         <DayBreak
  //           key={firstEvent.getId()! + "-daybreak"}
  //           previous={previous}
  //           current={firstEvent}
  //         />
  //         <StateFrame
  //           key={firstEvent.getId()!}
  //           userId={firstEvent.getSender()!}
  //         >
  //           {list.map((id) => eventRecord[id]!)}
  //         </StateFrame>
  //       </>
  //     );
  //   }

  //   return (
  //     <>
  //       <DayBreak
  //         key={firstEvent.getId()! + "-daybreak"}
  //         previous={previous}
  //         current={firstEvent}
  //       />
  //       <MessageFrame
  //         key={firstEvent.getId()!}
  //         userId={firstEvent.getSender()!}
  //         displayName={displayName}
  //         timestamp={firstEvent.getTs()}
  //       >
  //         {list.map((id) => eventRecord[id]!)}
  //       </MessageFrame>
  //     </>
  //   );
  // });
};

const isDifferentDay = (previous: MatrixEvent, current: MatrixEvent) => {
  const previousDate = new Date(previous.getTs());
  const date = new Date(current.getTs());

  return date.getDate() !== previousDate.getDate();
};

const DayBreak = ({
  previous,
  current,
}: {
  previous: MatrixEvent | null;
  current: MatrixEvent;
}) => {
  if (!previous || !isDifferentDay(previous, current)) {
    return null;
  }

  return <DateMessage date={new Date(current.getTs())} />;
};

const TitleBar = ({
  roomName,
  roomState,
  showMembers,
  setShowMembers,
}: {
  roomName: string;
  roomState: RoomState | null;
  showMembers: boolean;
  setShowMembers: (_: boolean) => void;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative isolate z-0 flex min-h-[42px] items-center justify-between text-gray-800 bg-opacity-50 bg-blue-300 px-4"
      id="header"
    >
      <Modal title={roomName} visible={visible} setVisible={setVisible}>
        <p>
          {
            roomState?.events.get(EventType.RoomTopic)?.get("")?.getContent()
              .topic
          }
        </p>
      </Modal>
      <button
        className="truncate shrink outline-none"
        onClick={() => setVisible(true)}
      >
        <span className="font-bold">{roomName}</span>
        {(
          <>
            {roomState?.events
              .get(EventType.RoomTopic)
              ?.get("")
              ?.getContent() ? (
              <>
                <span className="border-indigo-800 ml-[6px] min-h-[150%] border-l-[2px] mr-[4px]" />
                {
                  roomState?.events
                    .get(EventType.RoomTopic)
                    ?.get("")
                    ?.getContent().topic
                }
              </>
            ) : null}
          </>
        ) ?? ""}
      </button>
      <div className="relative grow basis-4 flex justify-end">
        <button
          className="bg-inherit"
          onClick={() => setShowMembers(!showMembers)}
        >
          <MembersIcon className="fill-current text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default MessageWindow;
