import { PropsWithChildren, useState, useRef, useCallback, useEffect } from "react";

const Sidebar = (props: PropsWithChildren) => {
  const [sidebarWidth, setResizableSidebarWidth] = useState(300);
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
        setResizableSidebarWidth(mouseMoveEvent.clientX + 30);
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

  return (
    <>
      <div style={{ flexBasis: sidebarWidth }} ref={sidebarRef}>
        {props.children}
      </div>
      <div
        className="p-1 cursor-col-resize resize-x hover:bg-slate-400"
        onMouseDown={startResizing}
      ></div>
    </>
  );
};

export default Sidebar;
