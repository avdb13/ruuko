import  { KeyboardEvent, PropsWithChildren, Ref, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

const Modal = forwardRef<ModalProps, PropsWithChildren>((props, ref) => {
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const [visible, setVisible] = useState(false);

  console.log(visible);

  const toggleVisibility = () => {
    setVisible(!visible);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      setVisible(false);
    }
  };

  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      visible ? modal.showModal() : modal.close();
    }

  }, [visible]);

  useImperativeHandle(ref as Ref<ModalProps>, () => {
    return { toggleVisibility }
  });

  return (
    // ugly hack
    <dialog ref={modalRef && undefined} id="modal" onKeyDown={handleKeyDown}>
      {props.children}
    </dialog>
  )
});

export default Modal
