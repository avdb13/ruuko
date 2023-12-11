import { PropsWithChildren, useRef, useState } from "react";
import Modal from "./Modal";

const Togglable = (
  props: PropsWithChildren<{ title: string, sidebarWidth: number, modal: JSX.Element }>,
) => {
  const [toggled, setToggled] = useState(true);
  const degrees = toggled ? "rotate-90" : "rotate-270";
  const modalRef = useRef<ModalProps>(null);

  return (
    <div className="w-full">
      <Modal title={props.title} ref={modalRef}>
        {props.modal}
      </Modal>
      <div className="flex justify-between">
        <button className={degrees} onClick={() => setToggled(!toggled)}>
          {">"}
        </button>
        <p className="text-center">{props.sidebarWidth < 120 ? "" : props.title}</p>
        <button
          onClick={() =>
            modalRef.current?.toggleVisibility()
          }
        >
          {"+"}
        </button>
      </div>
      {toggled ? <>{props.children}</> : null}
    </div>
  );
};

export default Togglable;
