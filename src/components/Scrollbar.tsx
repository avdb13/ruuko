import { IContent } from "matrix-js-sdk";
import { PropsWithChildren } from "react";

const Scrollbar = (props: PropsWithChildren<{width: number, minWidth: number}>) => {

  if (props.width < props.minWidth) {
    return props.children;
  }

  const x: IContent = {};
  return (
    <div className="overflow-y-auto [&>*]:scrollbar">
      <div className="px-1">
        {props.children}
      </div>
    </div>
  )
}

export default Scrollbar;
