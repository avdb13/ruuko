import {
  PropsWithChildren,
  useEffect,
  useRef,
} from "react";

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
  }, [visible, modalRef]);

  return (
    <dialog id="modal" className="open:animate-modal close:animate-hide pointer-events-auto">
      <div className="relative w-[600px] h-[400px]">
      <div className="flex flex-col">
        <div className="flex justify-between m-4 items-center">
          <h1 className="bg-zinc-100 rounded-md py-1 font-bold text-xl">{props.title}</h1>
          <button className="m-4 border-2 border-black w-8 h-8" onClick={() => setVisible(false)}>{"x"}</button>
        </div>
        <div className="flex flex-col items-center gap-4">
          {props.children}
        </div>
      </div>
      </div>
    </dialog>
  );
};

export default Modal;
