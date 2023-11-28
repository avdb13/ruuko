import { useEffect, useRef } from "react";

const useTimeout = (callback: () => void, delay: number) => {
  const ref = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => callbackRef.current();
    ref.current = setTimeout(tick, delay);

    return () => clearTimeout(ref.current!);
  }, [delay, ref]);

  return ref;
}

export default useTimeout;
