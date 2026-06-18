// Core shared translations used across all packages

import commonAR from "./locales/ar/common.json";
import notificationsAR from "./locales/ar/notifications.json";
import validationAR from "./locales/ar/validation.json";
import commonEN from "./locales/en/common.json";
import notificationsEN from "./locales/en/notifications.json";
import validationEN from "./locales/en/validation.json";
import commonES from "./locales/es/common.json";
import notificationsES from "./locales/es/notifications.json";
import validationES from "./locales/es/validation.json";
import commonFR from "./locales/fr/common.json";
import notificationsFR from "./locales/fr/notifications.json";
import validationFR from "./locales/fr/validation.json";
import commonHI from "./locales/hi/common.json";
import notificationsHI from "./locales/hi/notifications.json";
import validationHI from "./locales/hi/validation.json";
import commonJA from "./locales/ja/common.json";
import notificationsJA from "./locales/ja/notifications.json";
import validationJA from "./locales/ja/validation.json";
import commonNL from "./locales/nl/common.json";
import notificationsNL from "./locales/nl/notifications.json";
import validationNL from "./locales/nl/validation.json";

export const coreResources = {
	en: {
		common: commonEN,
		validation: validationEN,
		notifications: notificationsEN,
	},
	es: {
		common: commonES,
		validation: validationES,
		notifications: notificationsES,
	},
	fr: {
		common: commonFR,
		validation: validationFR,
		notifications: notificationsFR,
	},
	hi: {
		common: commonHI,
		validation: validationHI,
		notifications: notificationsHI,
	},
	ar: {
		common: commonAR,
		validation: validationAR,
		notifications: notificationsAR,
	},
	ja: {
		common: commonJA,
		validation: validationJA,
		notifications: notificationsJA,
	},
	nl: {
		common: commonNL,
		validation: validationNL,
		notifications: notificationsNL,
	},
} as const;
