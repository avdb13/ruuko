const Spinner = () => {
  // const divStyle =
  //   "absolute ring-[4px] ring-zinc-600 rounded-full animate-ping";

      // <button className="text-center">logout</button>
  return (
    <>
      <div className="ripple"><div></div><div></div></div>
      <img src="/logo.png" className="box-border scale-[50%] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" id="logo" />
    </>
  );
};
      // <img src="/logo-white.png" className="scale-[20%] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-sm" id="logo" />

export default Spinner;
