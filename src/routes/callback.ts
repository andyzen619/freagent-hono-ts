import fs from "fs";
import axios from "axios";
import type { Context } from "hono";

export default ({ getUri, logger, TOKEN_URL, CLIENT_ID, CLIENT_SECRET }) =>
  async function (c: Context) {
    const { code } = c.req.query();

    const { REDIRECT_URI } = getUri(c.req);

    try {
      const tokenResponse = await axios.post(
        TOKEN_URL,
        new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code,
          grant_type: "authorization_code",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const authenticationToken = tokenResponse.data.access_token;

      fs.writeFileSync(
        "authenticationToken.json",
        JSON.stringify({ authenticationToken })
      );

      return c.text("Authentication successful! You can now use the API.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("Error fetching access token:", error.response?.data);

        return c.text("Authentication failed: " + error.response?.data?.error);
      }

      logger.error("An unexpected error occurred:", error);

      return c.text("Authentication failed due to an unexpected error.", 500);
    }
  };
