import Home from "./Home";

// const formatMessageEvent = (event: MatrixEvent) => {
//   const sender = event.sender ? event.sender.name : event.getSender();
//   if (event.getType() === EventType.RoomMessage) {
//     return `${sender}: ${event.event.content!.body}`;
//   }
// };

const App = () => {
  return (
    <div>
      <Home messages={[]} />
    </div>
  );
};

export default App;
