import { MatrixEvent } from "matrix-js-sdk";


const eventFormatter = (event: MatrixEvent) => {
  const content = event.getContent();

  if (content.membership === "join") {
    return `${event.sender?.name} joined`
  }
}
