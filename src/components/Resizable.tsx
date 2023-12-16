import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface ResizableProps {
  width: number;
  minWidth: number;
  setWidth: (_: number) => void;
  side?: "left" | "right";
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
        console.log(mouseMoveEvent.clientX, window.outerWidth)
        setSidebarWidth(
          props.side === "right"
            ? mouseMoveEvent.clientX
            : (window.innerWidth - mouseMoveEvent.clientX),
        );
        if (mouseMoveEvent.clientX < props.minWidth) {
          setSidebarWidth(props.minWidth / 2);
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

  const resizerStyle = "px-[2px] h-full cursor-col-resize bg-inherit shadow-md resize-x";
  return (
    <>
      <div
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        onMouseDown={(e) => e.preventDefault()}
        className="isolate flex"
      >
        {!props.side || props.side === "left" ? (
          <div onMouseDown={startResizing} className={resizerStyle} />
        ) : null}
        <div className={props.className}>{props.children}</div>
        {props.side === "right" ? <div onMouseDown={startResizing} className={resizerStyle} /> : null}
      </div>
    </>
  );
};

export default Resizable;
