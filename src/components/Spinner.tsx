import { ComponentProps } from "react";

const Spinner = (props: ComponentProps<"div">) => {
  // const divStyle =
  //   "absolute ring-[4px] ring-zinc-600 rounded-full animate-ping";

      // <button className="text-center">logout</button>
  return (
    <>
      <div className={"ripple " + props.className}><div></div><div></div></div>
    </>
  );
};
      // <img src="/logo-white.png" className="scale-[20%] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-sm" id="logo" />

export default Spinner;
