// import axios from "axios";
import * as sdk from "matrix-js-sdk";
import parseUrl from "parse-url";


const login = async (baseUrl: string, username: string, password: string) => {
  // TODO: support all login types
  const parsed = parseUrl(baseUrl, true);

  const client = sdk.createClient({
    baseUrl: `https://${parsed.resource}`,
  });

  const resp = await client.login("m.login.password", {
    identifier: { type: "m.id.user", user: username },
    password,
    initial_device_display_name: "Ruuko",
  });

  const session: Session = {
    baseUrl: resp.well_known?.["m.homeserver"]?.base_url || `https://${parsed.resource}`,
    device: resp.device_id,
    user: resp.user_id,
    accessToken: resp.access_token,
  };

  console.log(session);

  localStorage.setItem("session", JSON.stringify(session));

  return client;
};

// const healthCheck = async (baseUrl: string) => {
//   const resp = await axios.get(`${baseUrl}/_matrix/client/v3/login`)

//   return resp.status === 200;
// }

export default { login };
