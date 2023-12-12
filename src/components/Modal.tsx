import { ComponentProps, PropsWithChildren, useEffect, useRef } from "react";
import CrossNoCircleIcon from "./icons/CrossNoCircle";

const Modal = (props: PropsWithChildren<ModalProps>) => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const { visible, setVisible } = props;

  useEffect(() => {
    if (modalRef.current) {
      const modal = modalRef.current;

      if (visible) {
        modal.close();

        modal.showModal();
      } else {
        modal.close();
      }
    }
  }, [visible]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      setVisible(false);
    }
  };

  return (
    <dialog
      ref={modalRef}
      className={
        "p-4 open:animate-modal close:animate-hide modal " + props.className || ""
      }
      onKeyDown={handleKeyDown}
    >
        <div className="flex justify-between items-center h-8 w-full">
          <h1 className="bg-zinc-100 rounded-md py-1 font-bold text-xl">
            {props.title}
          </h1>
          <button
            className="w-8 h-8 flex justify-center items-center"
            onClick={() => setVisible(false)}
          >
            <CrossNoCircleIcon />
          </button>
        </div>
        {props.children}
    </dialog>
  );
};

export const Input = (props: ComponentProps<"input">) => {
  return <input {...props} autoFocus />;
};

export default Modal;
