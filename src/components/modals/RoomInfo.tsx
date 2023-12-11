import Modal from "../Modal";

const RoomInfo = (props: Omit<ModalProps, "title">) => {
  return (
    <Modal title="" visible={props.visible} setVisible={props.setVisible} width={300} height={200}>
      <p>hello</p>
    </Modal>
  );
}

export default RoomInfo;
