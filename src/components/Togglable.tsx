import { PropsWithChildren, Ref, useRef, useState } from "react";

const Togglable = (
  props: PropsWithChildren<{ title: string, sidebarWidth: number, modal: (_: Ref<ModalProps>) => JSX.Element }>,
) => {
  const [toggled, setToggled] = useState(true);
  const degrees = toggled ? "rotate-90" : "rotate-270";
  const modalRef = useRef<ModalProps>(null);
  const modal = props.modal(modalRef);

  return (
    <div>
      {modal}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <button className={degrees} onClick={() => setToggled(!toggled)}>
            {">"}
          </button>
          <p>{props.sidebarWidth > 120 ? "" : props.title}</p>
        </div>
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
