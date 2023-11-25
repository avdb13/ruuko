import { PropsWithChildren } from "react";

const Scrollbar = (props: PropsWithChildren) => {
  return (
    <div className="overflow-y-auto [&>*]:scrollbar">
      {props.children}
    </div>
  )
}

export default Scrollbar;
