// Standalone Audit Log app lazy translations.
//
// The dedicated Audit Log SPA renders the shared audit-log components, so it only
// needs the core namespaces plus the shared `auditlog` namespace. Unlike the client
// it is NOT locked to English — it follows the shared `smss-language` value (the
// same one the playground language switcher writes), with English fallback.
import type { LazyResources } from "./types";

export const auditlogResources: LazyResources = {
	ns: ["common", "notifications", "validation", "auditlog"],
	load: {
		// core
		common: (l) => import(`./locales/${l}/common.json`),
		notifications: (l) => import(`./locales/${l}/notifications.json`),
		validation: (l) => import(`./locales/${l}/validation.json`),
		// shared
		auditlog: (l) => import(`./locales/${l}/shared/auditlog.json`),
	},
};
