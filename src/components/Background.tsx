import { PropsWithChildren } from "react";

const Background = (props: PropsWithChildren) => {
  return (
    <div className="relative h-screen w-screen bg-[#888] fade overflow-hidden z-0">
      <div>
        <div
          className="chip"
          style={{
            background: "linear-gradient(#855afc, #3ac8fc)",
            filter: "hue-rotate(-15deg) blur(60px)",
            translate: "10% 20%",
            scale: "120%",
            rotate: "45deg",
            borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
          }}
        ></div>
        <div
          className="chip"
          style={{
            background: "linear-gradient(#855afc, #3ac8fc)",
            filter: "hue-rotate(15deg) blur(60px)",
            scale: "140%",
            translate: "-10% -20%",
            borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            opacity: "0%",
            filter: "blur(100px)",
            inset: "0",
            background: "radial-gradient(ellipse at top, #f8f8ff00, #000F)",
            height: "100%",
            width: "100%",
          }}
        ></div>
      </div>
      <div className="">
        {props.children}
      </div>
    </div>
  )
}

export default Background;
