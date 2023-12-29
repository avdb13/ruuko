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
  }, [visible, modalRef]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      setVisible(false);
    }
  };

  return (
    <dialog
      ref={modalRef}
      className={
        "isolate p-4 open:animate-modal close:animate-hide modal " +
          props.className || ""
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

export const AuthModal = (
  props: PropsWithChildren<Omit<ModalProps, "title"> & {password: string, setPassword: (_: string) => void}>,
) => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const { visible, setVisible } = props;
  console.log(props.visible);

  useEffect(() => {
    setVisible(false);
  }, []);

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      setVisible(false);
    }
  };

  const handleSubmit = {

  };

  return (
    <dialog
      ref={modalRef}
      className={
        "isolate p-4 open:animate-modal close:animate-hide modal h-fit"
      }
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-col w-80 justify-between items-center h-fit w-full">
        <div className="basis-1/5 w-full flex">
          <div className="grow" />
          <button
            className="w-8 flex justify-center items-center"
            onClick={() => setVisible(false)}
          >
            <CrossNoCircleIcon />
          </button>
        </div>
        <form className="flex flex-col gap-4 items-center justify-center" onSubmit={handleSubmit}>
          <div className="text-center">
            <label>please enter your password</label>
            <input type="password" className="text-center px-1 bg-gray-100" />
          </div>
          <button
            type="submit"
            className="border-4 font-bold border-gray-200 hover:bg-gray-100 duration-200 rounded-md w-fit px-2 text-gray-600 shadow-sm"
          >
            submit
          </button>
        </form>
        <div className="basis-1/5 grow" />
      </div>
    </dialog>
  );
};

export default Modal;
