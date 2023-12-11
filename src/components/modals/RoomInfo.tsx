import { useRef } from "react";
import Modal from "../Modal";

const RoomInfo = () => {
  const modalRef = useRef<ModalProps>(null);

  return (
    <Modal title="settings" ref={modalRef}>
      <p>hello</p>
    </Modal>
  );
}
