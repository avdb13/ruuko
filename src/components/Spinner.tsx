const Spinner = () => {
  const divStyle =
    "absolute ring-[4px] ring-zinc-600 rounded-full animate-ping";

      // <button className="text-center">logout</button>
  return (
    <div>
      <img src="/logo.png" className="scale-[25%] opacity-90 drop-shadow-sm" id="logo" />
      <div className="z-0 w-[108px] h-[108px] ripple scale-[150%]">
        <div className={divStyle}></div>
        <div className={divStyle}></div>
      </div>
    </div>
  );
};

export default Spinner;
