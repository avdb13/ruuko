import { MatrixEvent } from "matrix-js-sdk";
import { useContext } from "react";
import { ClientContext } from "../../providers/client";

const Annotation = ({ annotation }: { annotation: MatrixEvent }) => {
  const key = annotation.getContent()["m.relates_to"]?.key;
  const client = useContext(ClientContext);

  return (
    <div className="inline-flex items-center bg-gray-50 text-gray-600 px-2 py-1 ring-4 ring-inset ring-gray-500/10 rounded-md">
      <p>{key?.startsWith("mxc") ? <img src={client.mxcUrlToHttp(key)!} className="h-5" alt={key} /> : key }</p>
    </div>
  )
}

export default Annotation;
