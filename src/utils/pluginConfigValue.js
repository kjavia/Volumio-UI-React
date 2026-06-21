export const normalizeConfigValue = (value) => {
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }
  return value;
};

export const normalizeConfigString = (value, fallback = '') => {
  const normalized = normalizeConfigValue(value);
  return typeof normalized === 'string' && normalized.length > 0 ? normalized : fallback;
};
