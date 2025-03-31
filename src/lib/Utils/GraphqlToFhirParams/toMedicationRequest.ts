import type { CommonParams } from "./index.js";

interface ToMedicationRequestParams {
  din: null | String;
}

export const toMedicationRequest =
  (commonParams: CommonParams) =>
  ({ din }: ToMedicationRequestParams) => {
    const observation = {
      ...commonParams,
      code: { id: din },
    };

    return observation;
  };
