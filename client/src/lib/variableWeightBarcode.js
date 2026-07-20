export function parseVariableWeightCode(code, settings) {
  if (!settings?.variableWeightEnabled || !code) return null;

  const prefix = settings.variableWeightPrefix || "";
  if (prefix && !code.startsWith(prefix)) return null;

  const itemStart = Number(settings.variableWeightItemStart) || 0;
  const itemLength = Number(settings.variableWeightItemLength) || 0;
  const weightStart = Number(settings.variableWeightWeightStart) || 0;
  const weightLength = Number(settings.variableWeightWeightLength) || 0;
  const decimals = Number(settings.variableWeightDecimals) || 0;

  if (itemLength <= 0 || weightLength <= 0) return null;

  const minLength = Math.max(itemStart + itemLength, weightStart + weightLength);
  if (code.length < minLength) return null;

  const itemCode = code.slice(itemStart, itemStart + itemLength);
  const weightDigits = code.slice(weightStart, weightStart + weightLength);
  if (!/^\d+$/.test(itemCode) || !/^\d+$/.test(weightDigits)) return null;

  const weight = Number(weightDigits) / Math.pow(10, decimals);
  if (!Number.isFinite(weight) || weight <= 0) return null;

  return { itemCode, weight };
}
