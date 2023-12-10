import { IContent, MsgType, RelationType } from "matrix-js-sdk";

const createContent = () => {};

export const createReplaceEvent = (newBody: string, toReplaceId: string) => {
  const replacement: IContent = {
    body: "* " + newBody,
    msgtype: MsgType.Text,
    "m.new_content": {
      body: newBody,
      msgtype: MsgType.Text,
    },
    "m.relates_to": {
      rel_type: RelationType.Replace,
      event_id: toReplaceId,
    },
  };

  return replacement;
};
