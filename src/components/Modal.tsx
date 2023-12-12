import { PropsWithChildren, useEffect, useRef } from "react";

const Modal = (props: PropsWithChildren<ModalProps>) => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const { visible, setVisible } = props;

  useEffect(() => {
    if (modalRef.current) {
      const modal = modalRef.current;

      if (visible) {
        modal.close();
        modal.showModal();
        modal.focus();
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
      className="relative open:animate-modal close:animate-hide modal z-10"
      onKeyDown={handleKeyDown}
      onClick={() => console.log("clicked")}
    >
      <div className="flex flex-col">
        <div className="flex justify-between m-4 items-center">
          <h1 className="bg-zinc-100 rounded-md py-1 font-bold text-xl">
            {props.title}
          </h1>
          <input type="text" className="bg-gray-200" />
          <button
            className="m-4 border-2 border-black w-8 h-8"
            onClick={() => setVisible(false)}
          >
            {"x"}
          </button>
        </div>
        <div>{props.children}</div>
      </div>
    </dialog>
  );
};

export default Modal;
