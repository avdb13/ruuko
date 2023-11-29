import { SyntheticEvent, useContext, useEffect, useRef, useState } from "react";
import { ClientContext } from "../providers/client";
import FileIcon from "./icons/File";

const FilePicker = ({ setFiles, inputRef }: { setFiles: (_: File[] | null) => void, inputRef: Ref<HTMLInputElement> }) => {
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
        className="basis-8 invisible"
        type="file"
        onChange={handleChange}
        ref={inputRef}
      />
      <button className="w-8 h-8 my-2 absolute rounded-md border-2" onClick={() => inputRef.current ? inputRef.current.click() : null} >
        <FileIcon />
      </button>
    </>
  );
};

const InputBar = ({ roomId }: { roomId: string }) => {
  const client = useContext(ClientContext);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[] | null>();
  const inputRef = useRef<HTMLInputElement>();

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    if (files) {
      const result = await Promise.all([
        ...files.map((f) => client.uploadContent(f)),
      ]);

      for (let resp of result) {
        // support adding messages later
        await client.sendImageMessage(roomId, resp.content_uri);
      }
    } else {
      client.sendTextMessage(roomId, message);
    }
    setMessage("");
    setFiles(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex gap-2 sticky h-12 ml-2"
    >
      <FilePicker setFiles={setFiles} inputRef={inputRef} />
      <input
        id="input-panel"
        className="flex bg-green-200 grow p-1 rounded-md my-2"
        placeholder={`Message ${client.getRoom(roomId)?.name}`}
        onChange={(e) => setMessage(e.target.value)}
        value={message}
      />
      <button type="submit" style={{ visibility: "hidden" }}></button>
    </form>
  );
};

export default InputBar;
