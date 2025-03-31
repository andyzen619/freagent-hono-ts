// Define the type for commonParams without the `code` property
export type CommonFhir = {
  subject: { reference: string } | null;
};

export const GraphqlToFhirParams = ({
  memberId,
}: { memberId?: string } = {}) => {
  const commonParams: CommonFhir = {
    subject: memberId ? { reference: `Patient/${memberId}` } : null,
  };

  // Return a function that takes a transform function and applies it to commonParams
  return <T>(transform: (commonParams: CommonFhir) => T) => {
    return transform(commonParams);
  };
};

export const initializeCommonFhirParams =
  <T extends object, R extends object>(
    applyFhirExtension: (params: T) => CommonFhirParams & R
  ) =>
  ({ memberId, ...rest }: { memberId?: string } & T) => {
    const common = {
      subject: memberId ? { reference: `Patient/${memberId}` } : null,
    };

    return applyFhirExtension({ ...common, ...rest } as T & {
      subject?: { reference: string } | null;
    });
  };

export type CommonFhirParams = {
  subject?: { reference: string } | null;
};
