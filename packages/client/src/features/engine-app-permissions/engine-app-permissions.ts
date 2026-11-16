import type {
	AppAccessChange,
	AppSubject,
	CurrentAccess,
	ModelUsageLimit,
	PermissionBatch,
} from "@semoss/sdk";
import type { Project } from "@semoss/shared";
import { toSentGrant } from "@/features/bulk-access-management/permission-batch";

/**
 * The levels an engine can give an app, from least to most access. An app is
 * never an Author of an engine, so the engine's settings stay with its owners.
 */
export const ENGINE_APP_LEVELS = ["READ_ONLY", "EDIT"] as const;

/** A level an engine can give an app */
export type EngineAppLevel = (typeof ENGINE_APP_LEVELS)[number];

/** The level an app starts with when an engine gives it a permission */
export const DEFAULT_ENGINE_APP_LEVEL: EngineAppLevel = "READ_ONLY";

/** An app with the permission an engine gives it */
export type EngineApp = CurrentAccess<AppSubject>;

/**
 * The project types Add App offers: the ones the catalog lists as apps. An
 * engine can give a permission to a project of any type, and the table lists
 * every one it has given.
 */
export const ENGINE_APP_PROJECT_TYPES: Project["project_type"][] = [
	"CODE",
	"BLOCKS",
];

/** What an app's usage limit needs on a model */
export interface EngineAppModel {
	/** Whether the model has known prices, so the limit can have cost rules */
	isCostAvailable: boolean;
	/** Whether the user can set the limit: the model's owners, and admins in admin mode */
	canChangeLimit: boolean;
}

/**
 * @param level - an access level, or a value picked in a select
 * @returns whether an engine can give it to an app
 */
export const isEngineAppLevel = (level: string): level is EngineAppLevel =>
	ENGINE_APP_LEVELS.some((option) => option === level);

/**
 * @param engineId - the engine
 * @param change - the change to one app's permission on it
 * @returns the permission batch that makes the change
 */
const toAppBatch = (
	engineId: string,
	change: AppAccessChange,
): PermissionBatch => ({
	target: { resourceType: "ENGINE", id: engineId },
	changes: [change],
});

/**
 * The permission batch that gives an app a permission on an engine. No limit
 * defined leaves the limit out, as it is for any engine that is not a model.
 *
 * @param engineId - the engine
 * @param appId - the app
 * @param level - the level the app's custom reactors get
 * @param usageLimit - on a model, the app's usage limit, or null for no limit defined
 * @returns the batch to save
 */
export const toAddAppBatch = (
	engineId: string,
	appId: string,
	level: EngineAppLevel,
	usageLimit: ModelUsageLimit | null = null,
): PermissionBatch =>
	toAppBatch(engineId, {
		action: "ADD",
		subject: { category: "PROJECT", id: appId },
		to: toSentGrant({ level, endDate: null, usageLimit }),
	});

/**
 * The permission batch that changes an app's level on an engine. A change sets
 * the whole permission, so it carries the app's end date and, on a model, its
 * usage limit as they are.
 *
 * @param engineId - the engine
 * @param app - the app, with its current permission
 * @param level - the new level
 * @returns the batch to save
 */
export const toAppLevelBatch = (
	engineId: string,
	app: EngineApp,
	level: EngineAppLevel,
): PermissionBatch =>
	toAppBatch(engineId, {
		action: "CHANGE",
		subject: { category: "PROJECT", id: app.subject.id },
		to: toSentGrant({ ...app.access, level }),
	});

/**
 * The permission batch that changes an app's usage limit on a model. A change
 * sets the whole permission, so it carries the app's level and end date as
 * they are; no limit defined leaves the limit out.
 *
 * @param engineId - the model
 * @param app - the app, with its current permission
 * @param usageLimit - the new limit, or null for no limit defined
 * @returns the batch to save
 */
export const toAppLimitBatch = (
	engineId: string,
	app: EngineApp,
	usageLimit: ModelUsageLimit | null,
): PermissionBatch =>
	toAppBatch(engineId, {
		action: "CHANGE",
		subject: { category: "PROJECT", id: app.subject.id },
		to: toSentGrant({ ...app.access, usageLimit }),
	});

/**
 * @param engineId - the engine
 * @param appId - the app
 * @returns the permission batch that takes away the app's permission on the engine
 */
export const toRemoveAppBatch = (
	engineId: string,
	appId: string,
): PermissionBatch =>
	toAppBatch(engineId, {
		action: "REMOVE",
		subject: { category: "PROJECT", id: appId },
	});
