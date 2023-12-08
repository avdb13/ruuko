const Spinner = () => {
  // const divStyle =
  //   "absolute ring-[4px] ring-zinc-600 rounded-full animate-ping";

      // <button className="text-center">logout</button>
  return (
    <div>
      <div id="bg" className="w-screen h-screen opacity-25"></div>
      <img src="/logo.png" className="scale-[25%] opacity-90 drop-shadow-sm" id="logo" />
    </div>
  );
};

export default Spinner;
