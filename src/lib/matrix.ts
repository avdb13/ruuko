import * as sdk from "matrix-js-sdk";

export type Credentials = {
  baseUrl: string;
  username: string;
  password: string;
};

const login = async (credentials: Credentials) => {
  // TODO: support all login types
  const { baseUrl, username, password } = credentials;
  console.log(credentials);

  const client = sdk.createClient({
    baseUrl,
  });

  const authDict = {
    type: sdk.AuthType.Password,
    identifier: {
      type: "m.id.user",
      user: username,
    },
    password,
  }

  // no idea why this doesn't take AuthDict
  const resp = await client.login("m.login.password", {
    identifier: { type: "m.id.user", user: username },
    password,
    initial_device_display_name: "Ruuko",
  });


  await client.uploadDeviceSigningKeys(authDict);
  console.log("uploaded signing keys");

  const session: Session = {
    baseUrl: resp.well_known?.["m.homeserver"]?.base_url || baseUrl,
    device: resp.device_id,
    user: resp.user_id,
    accessToken: resp.access_token,
  };

  return session
};

export default { login };
