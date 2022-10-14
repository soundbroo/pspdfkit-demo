export const getSignerSignatureFieldName = (signerId, instantId) =>
  `${signerId}_signature${instantId ? `_${instantId}` : ""}`;
