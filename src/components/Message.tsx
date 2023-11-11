import { MatrixEvent } from "matrix-js-sdk";
import { useContext } from "react";
import { ClientContext } from "../providers/client";

const Message = ({ message }: { message: MatrixEvent }) => {
  const membership = message.getContent().membership;

  if (membership) {
    switch (membership) {
      case "join":
        return <JoinMessage message={message} />
    }
  } else {
    return <TextMessage message={message} />
  }
}

const TextMessage = ({ message }: { message: MatrixEvent }) => {
  const client = useContext(ClientContext);

  return (
    <div className="p-2 border-x-2 border-b-2 border-black">
      <li className="flex content-center gap-2">
        <img
          src={
            message.sender!.getAvatarUrl(
              client.baseUrl,
              80,
              80,
              "scale",
              true,
              true,
            ) || "/public/anonymous.jpg"
          }
          className="object-cover h-16 w-16 rounded-full self-center border-2"
        />
        <div className="flex flex-col">
          <div className="flex gap-4">
            <p>{message.getSender()}</p>
            <p>{new Date(message.getTs()).toLocaleString("en-US")}</p>
          </div>
          <p>{message.getContent().body}</p>
        </div>
      </li>
    </div>
  );
};

export const DateMessage = ({ date }: { date: Date }) => {
  return (
    <div className="p-2 border-x-2 border-b-2 border-black">
      <li className="flex content-center gap-2">
        <p>{date.toLocaleString("en-US")}</p>
      </li>
    </div>
  );
};

export const JoinMessage = ({ message }: { message: MatrixEvent }) => {
  const client = useContext(ClientContext);

  return (
    <div className="p-2 border-x-2 border-b-2 border-black">
      <li className="flex content-center gap-2">
        <img
          src={
            message.sender!.getAvatarUrl(
              client.baseUrl,
              80,
              80,
              "scale",
              true,
              true,
            ) || "/public/anonymous.jpg"
          }
          className="object-cover h-16 w-16 rounded-full self-center border-2"
        />
        <div className="flex flex-col justify-center">
          <p>{`${message.getPrevContent().displayname} changed their display name to ${message.getContent().displayname}`}</p>
        </div>
      </li>
    </div>
  );
};

export default Message;
