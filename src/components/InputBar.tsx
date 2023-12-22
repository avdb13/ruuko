import {
  Ref,
  RefObject,
  SyntheticEvent,
  forwardRef,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ClientContext } from "../providers/client";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import CrossIcon from "./icons/Cross";
import { RoomContext } from "../providers/room";
import { InputContext } from "../providers/input";
import {
  MatrixEvent,
  MsgType,
  RoomMember,
  RoomMemberEvent,
} from "matrix-js-sdk";
import { findLastTextEvent } from "../lib/helpers";
import Message, { Membership } from "./Message";
import CrossNoCircleIcon from "./icons/CrossNoCircle";
import CloudIcon from "./icons/Cloud";
import KnobIcon from "./icons/Knob";
import Avatar from "./Avatar";

const InputBar = ({ roomId }: { roomId: string }) => {
  const client = useContext(ClientContext);
  const { currentRoom, roomEvents } = useContext(RoomContext)!;
  const { inReplyTo, setInReplyTo, setReplace } = useContext(InputContext)!;

  const pickerRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<number>(0);
  const [typing, setTyping] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showMentionModal, setShowMentionModal] = useState(false);
  const [files, setFiles] = useState<File[] | null>(null);

  const replyEvent = currentRoom?.findEventById(inReplyTo || "") ?? null;

  const members = useMemo(() => {
    return currentRoom?.getMembers();
  }, [currentRoom?.roomId]);

  const mentionQuery = message.split("@")[1];
  // can't be null since it depends on InputBar, which is only available in a room
  const mentionQueryResult = mentionQuery
    ? members!
        .filter(
          (m) =>
            m.userId.slice(0, -1).toLowerCase().startsWith(mentionQuery.toLowerCase()) ||
            m.rawDisplayName.toLowerCase().startsWith(mentionQuery.toLowerCase()),
        )
        .slice(0, 6)
    : null;

  useEffect(() => {
    const handleTyping = (event: MatrixEvent, _member: RoomMember) => {
      setTyping(
        (event.getContent().user_ids as string[])
          .filter((me) => client.getUserId() !== me)
          .map((id) => currentRoom?.getMember(id)?.name || id),
      );
    };
    client.on(RoomMemberEvent.Typing, handleTyping);

    return () => {
      client.removeListener(RoomMemberEvent.Typing, handleTyping);
    };
  }, []);

  useEffect(() => {
    if (message.length > 0) {
      client.sendTyping(currentRoom?.roomId!, true, 1000);

      const id = setTimeout(() => {
        client.sendTyping(currentRoom?.roomId!, false, 1000);
      }, 5000);

      return clearTimeout(id);
    }
  }, [message]);

  useEffect(() => {
    setMessage("");
    setShowMentionModal(false);
    setShowPicker(false);
  }, [currentRoom?.roomId]);

  useEffect(() => {
    if (message.length > 0) {
      client.sendTyping(currentRoom?.roomId!, true, 1000);

      const id = setTimeout(() => {
        client.sendTyping(currentRoom?.roomId!, false, 1000);
      }, 5000);

      return clearTimeout(id);
    }
  }, [message]);

  useEffect(() => {
    const pickerHandler = handleClickOutside(pickerRef, setShowPicker);

    document.addEventListener("mousedown", pickerHandler);

    return () => {
      document.removeEventListener("mousedown", pickerHandler);
    };
  }, [pickerRef]);

  if (!currentRoom) {
    return null;
  }

  if (currentRoom?.getMyMembership() === Membership.Leave) {
    return <Rejoin handleJoinAgain={() => {}} />;
  }

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();

    if (showMentionModal) {
      const prefix = message.split("@")[0]!;

      // all variables have to be initialized because the modal is only open when
      // 1. there query contains an element
      // 2. the message contains @
      setMessage(prefix.concat(mentionQueryResult![0]!.userId!.slice(1)));
      setShowMentionModal(false);

      return;
    }

    if (files) {
      Promise.all([...files.map((f) => client.uploadContent(f))]).then(
        (result) => {
          for (let resp of result) {
            // support adding messages later
            client.sendImageMessage(roomId, resp.content_uri);
          }

          setFiles(null);
        },
      );

      // image replies are possible, careful
    } else if (replyEvent) {
      const member = currentRoom?.getMember(client.getUserId()!);

      const content = {
        msgtype: MsgType.Text,
        avatar_url: member?.getMxcAvatarUrl(),
        displayname: member?.rawDisplayName,
        body: message,
        ["m.relates_to"]: {
          ["m.in_reply_to"]: { event_id: inReplyTo || undefined },
        },
      };

      client.sendMessage(roomId, content);
    } else {
      client.sendTextMessage(roomId, message);
    }

    setMessage("");
    setInReplyTo(null);
  };

  const removeFile = (name: string) => {
    setFiles(files ? files.filter((f) => f.name !== name) : null);
  };

  const handleKeys = (e: React.KeyboardEvent) => {
    if (
      showMentionModal &&
      mentionQueryResult &&
      mentionQueryResult.length > 0
    ) {
      switch (e.key) {
        case "ArrowDown":
          console.log(selected)
          setSelected((selected + 1) % mentionQueryResult.length);
          return;
        case "ArrowUp":
          setSelected(
            selected === 0
              ? mentionQueryResult.length - 1
              : (selected - 1) % mentionQueryResult.length,
          );
          return;
        case "Enter":
          console.log("hi");
          return;
      }
    }
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        const events = roomEvents[currentRoom!.roomId]!;

        const lastEvent = findLastTextEvent(events, client.getUserId()!);
        if (lastEvent) {
          setReplace(lastEvent);
        }
        return;
    }
  };

  return (
    <>
      {typing.length > 0 ? (
        <span className="px-4 text-sm text-slate-800 py-2 shadow-sm">
          {typing.length > 2
            ? typing.length > 4
              ? `${typing.length} people are typing ...`
              : `${[typing].slice(0, -1).join(", ")}and ${[typing].slice(
                  -1,
                )} are typing ...`
            : `${[typing][0]} is typing ...`}
        </span>
      ) : null}
      {replyEvent ? (
        <div className="p-2">
          <div className="flex pb-2 justify-between border-dashed border-b-2">
            <h1 className="pl-4">
              replying to{" "}
              <strong>
                {replyEvent.getContent().displayname || replyEvent.getSender()!}
              </strong>
            </h1>
            <button onClick={() => setInReplyTo(null)}>
              <CrossNoCircleIcon className="scale-75" />
            </button>
          </div>
          <div className="pointer-events-none pt-2">
            <Message event={replyEvent} />
          </div>
        </div>
      ) : null}
      {files
        ? files.map((file) => (
            <FilePreview file={file} removeFile={removeFile} />
          ))
        : null}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 sticky h-12 mx-2"
      >
        <MentionModal
          visible={showMentionModal}
          setVisible={setShowMentionModal}
          queryResult={mentionQueryResult}
          message={message}
          setMessage={setMessage}
          selected={selected}
          setSelected={setSelected}
        />
        <FilePicker files={files} setFiles={setFiles} />
        <div className="flex bg-transparent grow rounded-md my-2 py-1">
          <input
            className="grow bg-transparent focus:outline-none mx-2"
            placeholder={`Message ${client.getRoom(roomId)?.name}`}
            onKeyDown={handleKeys}
            onChange={(e) => setMessage(e.target.value)}
            value={message}
          />
          <span className="relative flex justify-center items-center basis-8">
            <button
              className="peer"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPicker(!showPicker);
              }}
            >
              😺
            </button>
            <div
              ref={pickerRef}
              className="absolute right-[0%] bottom-[100%]  translate-x-0 duration-300 ease-out"
            >
              {showPicker ? (
                <EmojiPicker
                  emojiStyle={EmojiStyle.NATIVE}
                  skinTonesDisabled={true}
                  previewConfig={{ showPreview: false }}
                  onEmojiClick={(e, _) => {
                    setMessage(message.concat(e.emoji));
                    setShowPicker(false);
                  }}
                />
              ) : null}
            </div>
          </span>
        </div>
      </form>
    </>
  );
};

const FilePicker = ({
  files,
  setFiles,
}: {
  files: File[] | null;
  setFiles: (_: File[] | null) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: SyntheticEvent) => {
    const files = (e.target as HTMLInputElement).files;

    if (files) {
      setFiles(Array.from(files));
    }
  };

  return (
    <>
      <input
        className="basis-8 opacity-0"
        type="file"
        onChange={handleChange}
        ref={inputRef}
        multiple
      />
      <button
        type="button"
        className={`flex justify-center items-center w-8 h-8 my-2 absolute`}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        <CloudIcon />
      </button>
    </>
  );
};

const FilePreview = ({
  file,
  removeFile,
}: {
  file: File;
  removeFile: (_: string) => void;
}) => {
  // figure out how to truncate in the middle later
  const fileName = file.name.split(".");

  return (
    <div className="relative box-border flex flex-col justify-center w-48 h-48 border-2 p-2 m-4">
      <button
        className="absolute -top-[12px] -right-[12px] text-sm font-bold bg-red-400 rounded-full"
        onClick={() => removeFile(file.name)}
      >
        <CrossIcon />
      </button>
      <div className="flex items-center grow">
        <img src={URL.createObjectURL(file)} />
      </div>
      <p className="truncate">{file.name}</p>
    </div>
  );
};

type MentionModalProps = {
  visible: boolean;
  setVisible: (_: boolean) => void;
  queryResult: RoomMember[] | null;
  message: string;
  setMessage: (_: string) => void;
  selected: number;
  setSelected: (_: number) => void;
};
const MentionModal = ({
  queryResult,
  visible,
  setVisible,
  message,
  setMessage,
  selected,
  setSelected,
}: MentionModalProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = handleClickOutside(ref, setVisible);
    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [ref]);

  useEffect(() => {
    if (queryResult && queryResult.length > 0) {
      setVisible(true);
    }
  }, [queryResult]);

  if (!visible || !queryResult || queryResult.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="absolute w-[95%] right-[2.5%] bottom-[102.5%] bg-white border-2 border-slate-50 rounded-md shadow-md"
    >
      {queryResult.map((m, i) => (
        <button
          type="button"
          onClick={() => {
            setMessage(
              message.slice(0, message.lastIndexOf("@")).concat(m.userId),
            );
            setVisible(false);
          }}
          key={m.userId}
          className={`flex p-2 gap-2 items-center hover:bg-slate-100 duration-100 w-full ${
            selected === i ? "bg-red-100" : null
          }`}
        >
          <Avatar id={m.userId} size={8} className="border-none" type="user" />
          <p>{m.rawDisplayName}</p>
          <div className="grow" />
          <p className="text-gray-600">{m.userId}</p>
        </button>
      ))}
    </div>
  );
};

const TypingSpan = () => {};

const Rejoin = ({ handleJoinAgain }: { handleJoinAgain: () => void }) => (
  <div className="flex items-center gap-2 sticky h-16 mx-2 px-4">
    <p title="join" className="font-semibold text-xl">
      you left this room, click here to join again
    </p>
    <button
      onClick={handleJoinAgain}
      className="py-1 px-4 rounded-md bg-violet-200 border-gray-600 fill-current stroke-2 text-gray-600 border-4 shadow-md scale-75"
    >
      <KnobIcon />
    </button>
  </div>
);

const handleClickOutside =
  <T extends HTMLElement>(ref: RefObject<T>, setShow: (_: boolean) => void) =>
  (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setShow(false);
    }
  };

export default InputBar;
