import { PropsWithChildren } from "react"

const Modal = (props: PropsWithChildren) => {
  return (
    <dialog>
      {props.children}
    </dialog>
  )
}

export default Modal
