import { PropsWithChildren } from "react";

const Scrollbar = (props: PropsWithChildren<{width: number, minWidth: number, className?: string}>) => {

  if (props.width < props.minWidth) {
    return props.children;
  }

  return (
    <span className={"overflow-y-auto scrollbar " + props.className}>
      {props.children}
    </span>
  )
}

export default Scrollbar;
