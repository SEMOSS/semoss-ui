// Lazy resource configuration consumed by I18nBuilder.
//
// Instead of bundling every language's JSON up front, each app provides a map
// of namespace -> dynamic import (one per language). i18next pulls a namespace
// for the active language on demand via a small backend (see builder.ts), so
// only the language actually in use ships at first paint and switching
// languages fetches the new one lazily.
export interface LazyResources {
	/**
	 * Namespaces to preload for the active language during init so above-the-fold
	 * copy renders without a flash of raw keys. Other namespaces in `load` are
	 * fetched on demand (e.g. the client's embedded terminal namespaces).
	 */
	ns: string[];
	/**
	 * Maps a namespace to a loader that dynamically imports that namespace's JSON
	 * for the given language. The template-literal `import()` lets the bundler
	 * emit a separate chunk per language file.
	 */
	load: Record<string, (language: string) => Promise<unknown>>;
}
