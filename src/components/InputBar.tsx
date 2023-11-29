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
  const [files, setFiles] = useState<File[] | null>();

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

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex gap-2 sticky h-12 ml-2"
    >
      <FilePicker files={files} setFiles={setFiles} />
      <input
        id="input-panel"
        className="flex bg-green-200 grow p-1 rounded-md my-2"
        placeholder={`Message ${client.getRoom(roomId)?.name}`}
        onChange={(e) => setMessage(e.target.value)}
        value={message}
      />
    </form>
  );
};

export default InputBar;
