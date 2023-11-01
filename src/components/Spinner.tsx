const Spinner = () => {
  const divStyle = "absolute ring-[4px] ring-violet-500/100 rounded-full animate-ping";

  return (
      <div className="flex justify-center items-center h-screen w-screen translate-x-[-36px] translate-y-[-36px]">
        <div className="relative inline-block w-[72px] h-[72px] ripple">
          <div className={divStyle}></div>
          <div className={divStyle}></div>
        </div>
      </div>
  )
};

export default Spinner;
