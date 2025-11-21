export type GetJsonOptions = {
  defaultValue?: any;
  clearOnError?: boolean; // remove the corrupted key if parse fails
  parseJson?: boolean; // sometimes values are plain strings
};

/**
 * Safely retrieves a JSON value from localStorage.
 *
 * If the value is not a valid JSON, an error will be logged,
 * and the defaultValue will be returned. If clearOnError is true,
 * the corrupted key will be removed from localStorage.
 *
 * @param {string} key - The key of the value to retrieve
 * @param {GetJsonOptions} options - Options for retrieving the value
 * @return {T | null} - The retrieved value, or the default value if not found
 */

export function getJSON<T = any>(
  key: string,
  options: GetJsonOptions = {},
): T | null {
  const { defaultValue = null, clearOnError = true, parseJson = true } = options;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue as T;
    if (!parseJson) return (raw as unknown) as T;
    return JSON.parse(raw) as T;
  } catch (err) {
    // Log, heal by removing bad key (optional), and return default
    console.error(`[storage] failed to parse localStorage key="${key}"`, err);
    if (clearOnError) {
      try {
        clearStorage();
        console.warn(`[storage] removed corrupted key="${key}" from localStorage`);
      } catch (e) {
        console.error(`[storage] failed to remove corrupted key="${key}"`, e);
      }
    }
    return defaultValue as T;
  }
}

export function clearStorage() {
  try {
    localStorage.clear();
  } catch (err) {
    console.error(`[storage] failed to clear localStorage"`, err);
  }
}