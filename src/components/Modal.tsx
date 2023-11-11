import {
  KeyboardEvent,
  PropsWithChildren,
  Ref,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const Modal = forwardRef<ModalProps, PropsWithChildren>((props, ref) => {
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


  // const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
  //   if (event.key === "Escape") {
  //     setVisible(false);
  //   }
  // };

  useImperativeHandle(ref, () => ({ toggleVisibility }));

  return (
    <dialog ref={modalRef} id="modal">
      <div className="flex flex-col w-[600px] h-[400px] content-center">
        <button className="self-end m-4">{"x"}</button>
        {props.children}
      </div>
    </dialog>
  );
});

export default Modal;
