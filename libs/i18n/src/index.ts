export type { UseTranslationOptions } from "react-i18next";
export {
	I18nextProvider,
	Trans,
	Translation,
	useTranslation,
} from "react-i18next";
export { I18nBuilder, type I18nBuilderOptions } from "./builder";
export * from "./constants";
// Fetch on-demand namespaces (e.g. the client's embedded terminal) at runtime.
export { preloadNamespaces } from "./preload";
export { clientResources } from "./resources/client";
export { playgroundResources } from "./resources/playground";
export { terminalResources } from "./resources/terminal";
// Per-app lazy resource configs passed to I18nBuilder.
export type { LazyResources } from "./resources/types";
