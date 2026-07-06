import i18n from "i18next";

/**
 * Eagerly fetch namespaces that aren't preloaded at init (e.g. the client's
 * embedded terminal), for the active language, onto the shared instance.
 *
 * Call this from lazily-loaded code as it mounts so the namespace JSON is
 * fetched alongside that feature's chunk rather than at first paint. The loaded
 * event re-renders any components already waiting on these namespaces.
 */
export function preloadNamespaces(
	namespaces: string | string[],
): Promise<void> {
	return i18n.loadNamespaces(
		Array.isArray(namespaces) ? namespaces : [namespaces],
	);
}
