export {
	I18nextProvider,
	Trans,
	Translation,
	useTranslation,
} from "react-i18next";
export { I18nBuilder } from "./builder";
export * from "./constants";
// Export package-specific resources for custom configurations
export { clientResources } from "./resources/client";
export { coreResources } from "./resources/core";
export { playgroundResources } from "./resources/playground";
