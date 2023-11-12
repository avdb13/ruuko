const Annotation = ({ annotation }: { annotation: string }) => {
  return (
    <div className="inline-flex items-center bg-gray-50 text-gray-600 px-2 ring-4 ring-inset ring-gray-500/10 rounded-md">
      <p>{annotation}</p>
    </div>
  )
}

export default Annotation;
