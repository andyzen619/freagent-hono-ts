import type { Context } from "hono";

export default ({ getUri, CLIENT_ID, AUTH_URL }) =>
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
