import { PropsWithChildren, useEffect, useRef } from "react";

const Modal = (props: PropsWithChildren<ModalProps>) => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const { visible, setVisible } = props;

  useEffect(() => {
    if (modalRef.current) {
      const modal = modalRef.current;

      console.log(visible);
      if (visible) {
        modal.close();
        modal.showModal();
      } else {
        modal.close();
      }
    }
  }, [visible, modalRef]);

  return (
    <dialog
      ref={modalRef}
      id="modal"
      className="open:animate-modal close:animate-hide pointer-events-auto z-10"
    >
      <div className={"relative "}>
        <div className="flex flex-col">
          <div className="flex justify-between m-4 items-center">
            <h1 className="bg-zinc-100 rounded-md py-1 font-bold text-xl">
              {props.title}
            </h1>
            <button
              className="m-4 border-2 border-black w-8 h-8"
              onClick={() => setVisible(false)}
            >
              {"x"}
            </button>
          </div>
          <div
            className={"flex flex-col items-center gap-4 " + props.className}
            style={{
              minWidth: props.width ? `${props.width}px` : "auto",
              minHeight: props.height ? `${props.height}px` : "auto",
            }}
          >
            {props.children}
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default Modal;
