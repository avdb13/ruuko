import { IContent } from "matrix-js-sdk";


const eventFormatter = <T extends IContent>(content: T) => {
  if (content.membership === "join") {
    return `${}`
  }
}
