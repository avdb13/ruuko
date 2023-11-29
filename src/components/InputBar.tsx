import {
  Ref,
  SyntheticEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ClientContext } from "../providers/client";
import FileIcon from "./icons/File";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import CrossIcon from "./icons/Cross";

const FilePicker = ({
  files,
  setFiles,
}: {
  files: File[] | null;
  setFiles: (_: File[] | null) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>();
  // useEffect(() => {
  //   if (inputRef.current) {
  //     inputRef.current.fil
  //   }
  // }, [files])

  useEffect(() => {
    // set file previews
  }, []);

  const handleChange = (e: SyntheticEvent) => {
    console.log("changed");
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
        className={`flex justify-center items-center w-8 h-8 my-2 absolute rounded-md border-2 ${
          files ? "bg-green-100" : ""
        }`}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        <FileIcon />
      </button>
    </>
  );
};

const InputBar = ({ roomId }: { roomId: string }) => {
  const client = useContext(ClientContext);
  const [message, setMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [files, setFiles] = useState<File[] | null>(null);

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
    } else {
      client.sendTextMessage(roomId, message);
    }

    setMessage("");
  };

  const removeFile = (name: string) => {
    setFiles(files ? files.filter(f => f.name !== name) : null) 
  }
  return (
    <div className="flex flex-col">
      {files ? (
        files.map(file => <FilePreview file={file} removeFile={removeFile} />)
      ) : null}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 sticky h-12 mx-2 border-2">
        <FilePicker files={files} setFiles={setFiles} />
        <div className="flex bg-green-200 grow rounded-md my-2 py-1">
          <input
            id="input-panel"
            className="grow bg-transparent focus:outline-none mx-2"
            placeholder={`Message ${client.getRoom(roomId)?.name}`}
            onChange={(e) => setMessage(e.target.value)}
            value={message}
          />
          <span className="relative flex justify-center items-center basis-8">
            <button className="peer" onClick={() => setShowEmojis(!showEmojis)}>
              😺
            </button>
            <div className="absolute right-[0%] bottom-[100%] peer-active:translate-y-[10%] peer-active:opacity-0 opacity-100 translate-x-0 duration-300 ease-out">
              {showEmojis ? (
                <EmojiPicker
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
    </div>
  );
};

const FilePreview = ({ file, removeFile }: { file: File, removeFile: (_: string) => void }) => {
  // figure out how to truncate in the middle later
  const fileName = file.name.split(".");

  return (
    <div className="relative box-border flex flex-col justify-center w-48 h-48 border-2 p-2 m-4">
      <button className="absolute -top-[12px] -right-[12px] text-sm font-bold bg-red-400 rounded-full" onClick={() => removeFile(file.name)}><CrossIcon /></button>
      <div className="flex items-center grow">
        <img src={URL.createObjectURL(file)} />
      </div>
      <p className="truncate">{file.name}</p>
    </div>
  )
}

export default InputBar;
