import {
  PropsWithChildren,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const Modal = forwardRef<ModalProps, PropsWithChildren<{title: string}>>((props, ref) => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const modal = modalRef.current;

    if (modal) {
      if (visible) {
        modal.close();
        modal.showModal();
      } else {
        modal.close();
      }
    }
  }, [visible, modalRef]);

  const toggleVisibility = () => {
    setVisible(!visible);
  };

  useImperativeHandle(ref, () => ({ toggleVisibility }));

  return (
    <dialog ref={modalRef} id="modal" className="open:animate-modal close:animate-hide pointer-events-auto">
      <div className="relative w-[600px] h-[400px]">
      <div className="flex flex-col">
        <div className="flex justify-between m-4 items-center">
          <h1 className="bg-zinc-100 rounded-md py-1 font-bold text-xl">{props.title}</h1>
          <button className="m-4 border-2 border-black w-8 h-8" onClick={toggleVisibility}>{"x"}</button>
        </div>
        <div className="flex flex-col items-center gap-4">
          {props.children}
        </div>
      </div>
      </div>
    </dialog>
  );
});

export default Modal;
