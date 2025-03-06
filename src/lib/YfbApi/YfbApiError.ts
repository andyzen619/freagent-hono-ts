export default class YfbApiError extends Error {
  detail: string | undefined;

  constructor(error: { message: string; detail?: string }) {
    super(error.message);

    this.detail = error.detail;

    // Set the name explicitly for better debugging
    this.name = this.constructor.name;
  }
}
