type GetUriParams = {
  url: string;
};

export function getUri({ url }: GetUriParams) {
  const requestUrl = new URL(url);

  const BASE_URI = `https://${requestUrl.host}`;

  const REDIRECT_URI = `${BASE_URI}/auth/callback`;

  return { BASE_URI, REDIRECT_URI };
}

export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}

/**
 * Delays execution for the specified number of seconds.
 *
 * @param seconds - The number of seconds to delay.
 * @returns A promise that resolves after the delay.
 */
export function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
