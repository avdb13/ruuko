import { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";

interface ResizableProps {
  width: number;
  setWidth: (_: number) => void;
  side: "left" | "right";
  className?: string;
}

const Resizable = (props: PropsWithChildren<ResizableProps>) => {
  const [sidebarWidth, setSidebarWidth] = [props.width, props.setWidth];
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);
  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        setSidebarWidth(props.side === "right" ? mouseMoveEvent.clientX : window.outerWidth - sidebarWidth - mouseMoveEvent.clientX);
        if (mouseMoveEvent.clientX < 120) {
          setSidebarWidth(60);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);
  
  const children = (
      <div
        className={"flex flex-col shrink-0 grow-0 basis-1/2 bg-green-100 h-screen overflow-y-auto scrollbar px-2 w-min-0  " + props.className}
        onMouseDown={(e) => e.preventDefault()}
        style={{ flexBasis: sidebarWidth }}
        ref={sidebarRef}
      >
        {props.children}
      </div>
  )

  return props.side === "right" ? (
    <>
      {children}
      <div
        className="p-1 cursor-col-resize resize-x bg-green-50"
        onMouseDown={startResizing}
      ></div>
    </>
  ) : (
    <>
      <div
        className="p-1 cursor-col-resize resize-x bg-green-50"
        onMouseDown={startResizing}
      ></div>
      {children}
    </>

  );
};

export default Resizable;
