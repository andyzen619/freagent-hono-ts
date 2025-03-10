import axios, { type AxiosResponse } from "axios";
import { XMLParser } from "fast-xml-parser";

export function handleAxiosError(error: any, parser: XMLParser) {
  let errorToThrow = error;

  if (error.message.includes("token_missing")) {
    throw new Error("Unable to use authentication token. Please login again.");
  }

  if (axios.isAxiosError(error)) {
    const { response } = error;

    const errorStatusCode = response?.status || 500;

    errorToThrow.code = errorStatusCode;

    if (errorStatusCode === 401) {
      errorToThrow = new Error("Unable to authenticate API request");

      errorToThrow.externalVendorApiDetails = response?.data.error.description;

      errorToThrow.name = "UnauthenticatedError";

      throw errorToThrow;
    }

    if (errorStatusCode >= 400 && errorStatusCode <= 500) {
      const parsedResponse = parser.parse(response?.data);

      const { error: apiError } = parsedResponse;

      errorToThrow = new Error("Unable to process API request");

      errorToThrow.externalVendorApiDetails = apiError.description;

      errorToThrow.name = "RequestError";

      errorToThrow.request = {
        method: response?.config.method,
        url: response?.config.url,
        data: response?.config.data,
      };

      throw errorToThrow;
    }
  }

  throw errorToThrow;
}

export function isTokenExpired(data: string) {
  try {
    const { error } = JSON.parse(data);

    return `${error.description}`;
  } catch (error) {
    return "";
  }
}
