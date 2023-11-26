import { ComponentProps, ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";

// no idea why we need this but sure.
export const ModalInput = (props: ComponentPropsWithoutRef<"input">) => {
  const ref = useRef<HTMLInputElement>();

  return <input ref={ref} onClick={() => ref.current?.focus()} {...props} />;
};

// doesn't work properly ...
export const ModalSelect = (props: ComponentProps<"select">) => {
  const [visible, setVisible] = useState(false);

  const ref = useRef<HTMLSelectElement>();

  return (
    <select
      ref={ref}
      onClick={() => ref.current ? ref.current.size = 200 : null}
      onBlur={() => ref.current ? ref.current.size = 0 : null}
      {...props}
    >
      {props.children}
    </select>
  );
};
