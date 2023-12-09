import { useEffect, useState } from "react";
import CrossNoCircleIcon from "./icons/CrossNoCircle";
import WarningIcon from "./icons/Warning";
import OfflineIcon from "./icons/Offline";
import ErrorIcon from "./icons/Error";

export type IconType = "disconnected" | "warning" | "invalid";

const Alert = ({
  error,
  setError,
}: {
  error: { message: string; icon: IconType } | null;
  setError: (_: { message: string; icon: IconType } | null) => void;
}) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        setFade(true);
      }, 2700);
      setTimeout(() => {
        setFade(false);
        setError(null);
      }, 3000);
    }
  }, [error]);

  if (!error) {
    return null;
  }

  return (
    <div
      className={`transition-all duration-300 alert absolute border-b-2 border-gray-300 shadow-xl w-[50%] flex justify-center items-center bg-white rounded-sm z-10 ${
        fade ? "opacity-0 blur-2" : "opacity-100 blur-0"
      }`}
    >
      <div className="basis-[24px] bg-red-200 p-2 flex justify-center items-center rounded-sm ">
        {error.icon === "warning" ? (
          <WarningIcon class="fill-current text-red-600" />
        ) : error.icon === "disconnected" ? (
          <OfflineIcon class="fill-current text-red-600" />
        ) : (
          <ErrorIcon class="fill-current text-red-600" />
        )}
      </div>
      <div className="grow p-2 flex justify-start items-center">
        <p className="text-xs text-gray-800">{error.message}</p>
      </div>
      <div className="p-2 max-w-4 flex justify-center items-center">
        <button onClick={() => setError(null)}>
          <CrossNoCircleIcon class="scale-50 text-gray-600 fill-current text-center" />
        </button>
      </div>
    </div>
  );
};

export default Alert;
