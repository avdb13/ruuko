import * as sdk from "matrix-js-sdk";

const login = (baseUrl: string) => {
  const temporaryClient = sdk.createClient({ baseUrl });

  const matrixClient = sdk.createClient({
    baseUrl,
    accessToken,
    userId: "@example:localhost",
  })
}

const healthCheck = async (baseUrl: string) => {
  const resp = await axios.get(`${baseUrl}/_matrix/client/v3/login`)
  return resp.status === 200;
}
