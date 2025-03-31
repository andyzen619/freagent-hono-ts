import type { CommonFhir, CommonFhirParams } from "./index.js";

// Define the type for the parameters passed to the transform function
type ToObservationParams = {
  type: string;
};

// Define the toObservation function with its parameters
export const toObservation =
  (commonParams: CommonFhir) =>
  ({ type }: ToObservationParams) => {
    const observation = {
      ...commonParams,
      code: { text: type }, // Add `code` separately in the transformation
    };

    return observation;
  };

export const observationExtension = ({ type, ...rest }: { type?: string }) => {
  const observationParams = {
    ...rest,
    code: type ? { text: type } : null,
  } as {
    code?: { text: string } | null;
  };

  return observationParams;
};
