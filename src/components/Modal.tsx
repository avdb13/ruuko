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
        modal.showModal();
      } else {
        modal.close();
      }
    }
  }, [visible, modalRef]);

  const toggleVisibility = () => {
    setVisible(!visible);
  };


  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      setVisible(false);
    }
  };

  useImperativeHandle(ref, () => ({ toggleVisibility }));

  return (
    // ugly hack
    <dialog ref={modalRef} id="modal" onKeyDown={handleKeyDown}>
      {props.children}
    </dialog>
  );
});

export default Modal;
