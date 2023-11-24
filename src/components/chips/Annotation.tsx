import { MatrixEvent } from "matrix-js-sdk";
import { useContext } from "react";
import { ClientContext } from "../../providers/client";
import { mxcUrlToHttp } from "../../lib/helpers";

const Annotation = ({ annotation }: { annotation: MatrixEvent }) => {
  const key = annotation.getContent()["m.relates_to"]?.key;
  const client = useContext(ClientContext);
  const src = mxcUrlToHttp(client, key!);

  const handleClick = () => {
    // add
  };

  return (
    <div className="inline-flex items-center bg-gray-50 text-gray-600 px-2 py-1 ring-4 ring-inset ring-gray-500/10 rounded-md">
      <button onClick={handleClick}>{key?.startsWith("mxc") ? <img src={src} className="h-5 hover:bg-sky-600" alt={key} /> : key}</button>
    </div>
  )
}

export default Annotation;
