import { MatrixEvent } from "matrix-js-sdk";

const Annotation = ({ annotation }: { annotation: MatrixEvent }) => {
  return (
    <div className="inline-flex items-center bg-gray-50 text-gray-600 px-2 ring-4 ring-inset ring-gray-500/10 rounded-md">
      <p>{annotation.getContent()["m.relates_to"]?.key}</p>
    </div>
  )
}

export default Annotation;
