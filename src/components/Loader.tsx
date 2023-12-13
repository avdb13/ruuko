import { ComponentProps } from "react";

const Loader = (props: ComponentProps<"section">) => {
  const {className, ...rest} = props;
  return (
    <section {...rest} className={"dots-container " + className}>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </section>
  );
};

export default Loader;
