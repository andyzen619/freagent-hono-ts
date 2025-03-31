import { expect, describe, it } from "vitest";
import { GraphqlToFhirParams, initializeCommonFhirParams } from "./index.js";
import { toObservation, observationExtension } from "./toObservation.js";
import { toMedicationRequest } from "./toMedicationRequest.js";

describe("lib/Utils - GraphqlToFhirParams", () => {
  it("should create blood pressure observation for patient", () => {
    const bloodPressureObservation = GraphqlToFhirParams({ memberId: "1" })(
      toObservation
    )({
      type: "bloodPressure",
    });

    const { code, subject } = bloodPressureObservation;

    expect(subject?.reference).toBe("Patient/1");

    expect(code?.text).toBe("bloodPressure");
  });

  it("should create blood pressure observation for patient with GraphqlToFhirParams2 variant", () => {
    const observationParamsBuilder =
      initializeCommonFhirParams(observationExtension);

    const newBloodPressureObservationParams = observationParamsBuilder({
      memberId: "1",
      type: "BloodPressure",
    });

    const { code, subject } = newBloodPressureObservationParams;

    expect(subject?.reference).toBe("Patient/1");

    expect(code?.text).toBe("BloodPressure");
  });

  it("should not include type in bloodPressure update params for patient with GraphqlToFhirParams2 variant", () => {
    const observationParamsBuilder =
      initializeCommonFhirParams(observationExtension);

    const updateBloodPressureObservationParams = observationParamsBuilder({
      memberId: "1",
    });

    const { code, subject } = updateBloodPressureObservationParams;

    expect(subject?.reference).toBe("Patient/1");

    expect(code).toBeNull();
  });

  it("should update type for observation", () => {
    const bloodPressureObservationUpdateParams = GraphqlToFhirParams()(
      toObservation
    )({
      type: "bloodPressure2",
    });

    const { code, subject } = bloodPressureObservationUpdateParams;

    expect(subject).toBeNull();

    expect(code?.text).toBe("bloodPressure2");
  });

  it("should create medication request for patient", () => {
    const medicationRequest = GraphqlToFhirParams({ memberId: "1" })(
      toMedicationRequest
    )({
      din: "#123",
    });

    const { subject, code } = medicationRequest;

    expect(subject?.reference).toBe("Patient/1");

    expect(code?.id).toBe("#123");
  });
});
