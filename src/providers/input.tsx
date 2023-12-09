import { PropsWithChildren, createContext, useState } from "react";

interface InputState {
  inReplyTo: string | null;
  setInReplyTo: (_: string | null) => void;
  replace: string | null;
  setReplace: (_: string | null) => void;

}

export const InputContext = createContext<InputState | null>(null);

const InputProvider = (props: PropsWithChildren) => {
  const [inReplyTo, setInReplyTo] = useState<string | null>(null);
  const [replace, setReplace] = useState<string | null>(null);

  const inputState: InputState = {
    inReplyTo,
    setInReplyTo,
    replace,
    setReplace,
  };

  return (
    <InputContext.Provider value={inputState}>
      {props.children}
    </InputContext.Provider>
  );
};

export default InputProvider;
