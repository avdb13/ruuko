import { useEffect } from "react";
import WarningIcon from "./icons/Warning";
import CrossNoCircleIcon from "./icons/CrossNoCircle";

const Alert = ({
  error,
  setError,
}: {
  error: string | null;
  setError: (_: string | null) => void;
}) => {
  useEffect(() => {
    if (error) {

      setTimeout(() => setError(null), 3000);
    }
  }, [error])

  if (!error) {
    return null;
  }

  return (
    <div className="alert absolute border-b-2 border-gray-300 shadow-xl w-[50%] flex justify-center items-center bg-white rounded-sm z-10">
      <div className="basis-[24px] bg-gray-200 p-2 flex justify-center items-center rounded-sm ">
        <WarningIcon class="text-gray-600 fill-current" />
      </div>
      <div className="grow p-2 flex justify-start items-center">
        <p className="text-xs">{error}</p>
      </div>
      <div className="p-2 max-w-4 flex justify-center items-center">
        <button onClick={() => setError(null)}><CrossNoCircleIcon class="scale-50 text-gray-600 fill-current text-center" /></button>
      </div>
    </div>
  )
}

export default Alert;
