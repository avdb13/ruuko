import { PropsWithoutRef, useRef } from "react";

// no idea why we need this but sure.
const ModalInput = (props: PropsWithoutRef<any>) => {
  const searchRef = useRef<HTMLInputElement>();

  return <input ref={searchRef} onClick={() => searchRef.current?.focus()} {...props} />
}

export default ModalInput;
