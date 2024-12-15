import sqlite3 from "sqlite3";

type GetUriParams = {
  url: string;
};

export function getUri({ url }: GetUriParams) {
  const requestUrl = new URL(url);

  const BASE_URI = `https://${requestUrl.host}`;

  const REDIRECT_URI = `${BASE_URI}/callback`;

  return { BASE_URI, REDIRECT_URI };
}

export function execute(
  db: sqlite3.Database,
  sql: string,
  params?: any[],
  callback?: Function
): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        let result;

        if (this) {
          result = this;
        }

        resolve(result);
      }
    });
  });
}

export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}

export async function asyncBatchProcess(items, asyncBatchProcessFn, batchSize) {
  const batchedItems = items.reduce((acc, curr, index) => {
    const batchIndex = Math.floor(index / batchSize);

    acc[batchIndex] = acc[batchIndex] || [];

    acc[batchIndex].push(curr);

    return acc;
  }, []);

  const processedItems = batchedItems.reduce(
    async (accPromise, curr, index) => {
      let acc = await accPromise;

      const batchNumber = index;

      const promise = curr.map(async (item) =>
        asyncBatchProcessFn(item, batchNumber)
      );

      const processedItems = await Promise.all(promise);

      logger.log(processedItems);

      acc = [...acc, ...processedItems];

      return acc;
    },
    []
  );

  return processedItems;
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
