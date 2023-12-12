import {
  SyntheticEvent,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { ClientContext } from "../providers/client";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import CrossIcon from "./icons/Cross";
import { RoomContext } from "../providers/room";
import { InputContext } from "../providers/input";
import { MsgType } from "matrix-js-sdk";
import { findLastTextEvent } from "../lib/helpers";
import Message, { Membership } from "./Message";
import CrossNoCircleIcon from "./icons/CrossNoCircle";
import CloudIcon from "./icons/Cloud";
import KnobIcon from "./icons/Knob";

const FilePicker = ({
  files,
  setFiles,
}: {
  files: File[] | null;
  setFiles: (_: File[] | null) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // useEffect(() => {
  //   if (inputRef.current) {
  //     inputRef.current.fil
  //   }
  // }, [files])

  useEffect(() => {
    // set file previews
  }, []);

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

// export interface

const InputBar = ({ roomId }: { roomId: string }) => {
  const client = useContext(ClientContext);
  const { currentRoom, roomEvents } = useContext(RoomContext)!;
  const { inReplyTo, setInReplyTo, setReplace } = useContext(InputContext)!;

  const replyEvent = currentRoom?.findEventById(inReplyTo || "") ?? null;

  const [message, setMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [files, setFiles] = useState<File[] | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutsidePicker = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsidePicker);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsidePicker);
    }
  }, [pickerRef])

  if (!currentRoom) {
    return null;
  }

  if (currentRoom?.getMyMembership() === Membership.Leave) {
    return (
      <div
        className="flex items-center gap-2 sticky h-16 mx-2 px-4"
      >
      <p title="join" className="font-semibold text-xl">you left this room, click here to join again</p><button className="py-1 px-4 rounded-md bg-violet-200 border-gray-600 fill-current stroke-2 text-gray-600 border-4 shadow-md scale-75"><KnobIcon /></button></div>
    )
  }

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        ["m.relates_to"]: {
          ["m.in_reply_to"]: { event_id: inReplyTo || undefined },
        },
      };

      client.sendMessage(roomId, content);
      setInReplyTo(null);
    } else {

      client.sendTextMessage(roomId, message);
    }

    currentRoom?.setTimelineNeedsRefresh(true);
    setMessage("");
  };

  const removeFile = (name: string) => {
    setFiles(files ? files.filter((f) => f.name !== name) : null);
  };

  const handleKeys = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        const events = Object.values(roomEvents[currentRoom!.roomId]!);

        const lastEvent = findLastTextEvent(events, client.getUserId()!);
        if (lastEvent) {
          setReplace(lastEvent);
        }

        return;
    }
  };

  return (
    <>
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
        <FilePicker files={files} setFiles={setFiles} />
        <div className="flex bg-transparent grow rounded-md my-2 py-1">
          <input
            id="input-panel"
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
                setShowEmojis(!showEmojis);
              }}
            >
              😺
            </button>
            <div ref={pickerRef} className="absolute right-[0%] bottom-[100%]  translate-x-0 duration-300 ease-out">
              {showEmojis ? (
                <EmojiPicker
                  emojiStyle={EmojiStyle.NATIVE}
                  skinTonesDisabled={true}
                  previewConfig={{ showPreview: false }}
                  onEmojiClick={(e, _) => {
                    setMessage(message.concat(e.emoji));
                    setShowEmojis(false);
                  }}
                />
              ) : null}
            </div>
          </span>
        </div>
      </form>
    </>
  );
  // peer-active:translate-y-[10%] peer-active:opacity-0 opacity-100
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

export default InputBar;
