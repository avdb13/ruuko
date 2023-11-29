import { PropsWithChildren } from "react";

const Scrollbar = (props: PropsWithChildren) => {
  return (
    <div className="overflow-y-auto [&>*]:scrollbar">
      <div className="mx-4">
        {props.children}
      </div>
    </div>
  )
}

export default Scrollbar;
