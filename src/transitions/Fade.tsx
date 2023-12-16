import { PropsWithChildren, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";

const Fade = (props: PropsWithChildren<{ className?: string }>) => {
  const transRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);


  return (
    <CSSTransition
      nodeRef={transRef}
      in={show}
      timeout={500}
      unmountOnExit
      appear
      onEntered={() => setShow(true)}
      onExit={() => setShow(false)}
    >
      {(state) => (
        <div
          className={props.className}
          ref={transRef}
        >
          {props.children}
        </div>
      )}
    </CSSTransition>
  );
};

export default Fade;
