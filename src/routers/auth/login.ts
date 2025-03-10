import type { Context } from "hono";
import type { GetUriFunction } from "./types.js";

const login = ({
  getUri,
  CLIENT_ID,
  AUTH_URL,
}: {
  getUri: GetUriFunction;
  CLIENT_ID: string;
  AUTH_URL: string;
}) =>
  function (c: Context) {
    const { REDIRECT_URI } = getUri(c.req);

    const authParams = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      language: "en-us",
    });

    const authUrl = `${AUTH_URL}?${authParams.toString()}`;

    return c.redirect(authUrl);
  };

export default login;
