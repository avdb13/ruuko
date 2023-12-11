import { PropsWithChildren, useRef, useState } from "react";
import Modal from "./Modal";
import PlusIcon from "./icons/Plus";
import ArrowIcon from "./icons/Arrow";

const Togglable = (
  props: PropsWithChildren<{ title: string, sidebarWidth: number, modal: JSX.Element, className?: string }>,
) => {
  const [toggled, setToggled] = useState(true);
  const [visible, setVisible] = useState(false);

  return (
    <div className="w-full flex flex-col gap-4 px-4 py-2">
      <Modal title={props.title} visible={visible} setVisible={setVisible}>
        {props.modal}
      </Modal>
      <div className="flex justify-between bg-sky-100 p-2 rounded-md shadow-md">
        <button className={`duration-300 ease-in-out transition-all ${toggled ? "rotate-90" : "rotate-270"}`} onClick={() => setToggled(!toggled)}>
          <ArrowIcon className="scale-75" />
        </button>
        <p className="text-center">{props.sidebarWidth < 120 ? "" : props.title}</p>
        <button
          onClick={() =>
            setVisible(true)
          }
        >
          <PlusIcon className="scale-75" />
        </button>
      </div>
      {toggled ? <>{props.children}</> : null}
    </div>
  );
};

export default Togglable;
