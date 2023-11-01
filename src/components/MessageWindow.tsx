const MessageWindow = (messages) => {
  return (
    <div
      className="flex flex-col basis-full flex-grow flex-nowrap"
      id="right-panel"
    >
      <div className="basis-12 bg-slate-600" id="header">
        <p className="flex justify-center">Room 1</p>
      </div>
      <div className="overflow-y-auto bg-green-100 scrollbar">
        <div
          className="flex flex-col basis-4/5 bg-slate-300"
          id="message-panel"
        >
          <div className="bg-slate-400">
            <ul className="flex flex-col">
              {messages.map((message) => (
                <div className="p-2 border-x-2 border-b-2 border-black">
                  <li className="flex content-center gap-2">
                    <img
                      src="../public/avatar.jpg"
                      className="object-cover h-12 w-12 rounded-full basis-4 self-center border-2"
                    />
                    <div className="flex flex-col">
                      <div className="flex gap-4">
                        <p className="text-purple-200">author</p>
                        <p>Today at 5:08 PM</p>
                      </div>
                      <p>{message}</p>
                    </div>
                  </li>
                </div>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <input
        className="sticky basis-24 h-[100vh] bg-slate-500"
        id="input-panel"
      />
    </div>
  );
};

export default MessageWindow;
