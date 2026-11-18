import type {
	CurrentAccess,
	EngineAccessChange,
	EngineGranteeType,
	EngineSubject,
	ModelUsageLimit,
	PermissionBatch,
} from "@semoss/sdk";
import type { Engine } from "@semoss/shared";
import { toSentGrant } from "@/features/bulk-access-management/permission-batch";

/**
 * The levels an engine can give another engine, from least to most access. An
 * engine is never an Author of another engine, so its settings stay with its
 * owners.
 */
export const ENGINE_GRANTEE_LEVELS = ["READ_ONLY", "EDIT"] as const;

/** A level an engine can give another engine */
export type EngineGranteeLevel = (typeof ENGINE_GRANTEE_LEVELS)[number];

/** The level an engine starts with when another engine gives it a permission */
export const DEFAULT_ENGINE_GRANTEE_LEVEL: EngineGranteeLevel = "READ_ONLY";

/**
 * Another engine with the permission an engine gives it: a grantee of any type
 * but PROJECT, which is an app
 */
export type EngineGrantee = CurrentAccess<EngineSubject>;

/**
 * The engine types Add Engine offers: the engines whose own code calls other
 * engines, such as a vector database embedding with a model or a guardrail
 * asking its judge. Venv engines are left out, since engines use them with no
 * permission.
 */
export const ENGINE_GRANTEE_ENGINE_TYPES: Engine["engine_type"][] = [
	"MODEL",
	"VECTOR",
	"GUARDRAIL",
	"FUNCTION",
	"DATABASE",
	"STORAGE",
];

/** What an engine's usage limit needs on a model */
export interface EngineGranteeModel {
	/** Whether the model has known prices, so the limit can have cost rules */
	isCostAvailable: boolean;
	/** Whether the user can set the limit: the model's owners, and admins in admin mode */
	canChangeLimit: boolean;
}

/** An engine given a permission, by its id and catalog type */
export interface EngineGranteeRef {
	/** The engine's id */
	id: string;
	/** Its catalog type */
	type: EngineGranteeType;
}

/**
 * @param level - an access level, or a value picked in a select
 * @returns whether an engine can give it to another engine
 */
export const isEngineGranteeLevel = (
	level: string,
): level is EngineGranteeLevel =>
	ENGINE_GRANTEE_LEVELS.some((option) => option === level);

/**
 * @param type - an engine type, as an engine row of the catalog has it
 * @returns it as a grantee's catalog type, or null when it is not one
 */
export const toEngineGranteeType = (type: string): EngineGranteeType | null =>
	ENGINE_GRANTEE_ENGINE_TYPES.some((option) => option === type)
		? (type as EngineGranteeType)
		: null;

/**
 * @param engineId - the engine
 * @param change - the change to one engine's permission on it
 * @returns the permission batch that makes the change
 */
const toEngineBatch = (
	engineId: string,
	change: EngineAccessChange,
): PermissionBatch => ({
	target: { resourceType: "ENGINE", id: engineId },
	changes: [change],
});

/**
 * The permission batch that gives another engine a permission on an engine. No
 * limit defined leaves the limit out, as it is for any engine that is not a
 * model.
 *
 * @param engineId - the engine that gives the permission
 * @param grantee - the engine given it, by its id and catalog type
 * @param level - the level the engine's own code gets
 * @param usageLimit - on a model, the engine's usage limit, or null for no limit defined
 * @returns the batch to save
 */
export const toAddEngineBatch = (
	engineId: string,
	grantee: EngineGranteeRef,
	level: EngineGranteeLevel,
	usageLimit: ModelUsageLimit | null = null,
): PermissionBatch =>
	toEngineBatch(engineId, {
		action: "ADD",
		subject: { category: "ENGINE", id: grantee.id, type: grantee.type },
		to: toSentGrant({ level, endDate: null, usageLimit }),
	});

/**
 * The permission batch that changes another engine's level on an engine. A
 * change sets the whole permission, so it carries the engine's end date and, on
 * a model, its usage limit as they are.
 *
 * @param engineId - the engine that gives the permission
 * @param grantee - the engine given it, with its current permission
 * @param level - the new level
 * @returns the batch to save
 */
export const toEngineLevelBatch = (
	engineId: string,
	grantee: EngineGrantee,
	level: EngineGranteeLevel,
): PermissionBatch =>
	toEngineBatch(engineId, {
		action: "CHANGE",
		subject: {
			category: "ENGINE",
			id: grantee.subject.id,
			type: grantee.subject.type,
		},
		to: toSentGrant({ ...grantee.access, level }),
	});

/**
 * The permission batch that changes another engine's usage limit on a model. A
 * change sets the whole permission, so it carries the engine's level and end
 * date as they are; no limit defined leaves the limit out.
 *
 * @param engineId - the model
 * @param grantee - the engine given the permission, with its current permission
 * @param usageLimit - the new limit, or null for no limit defined
 * @returns the batch to save
 */
export const toEngineLimitBatch = (
	engineId: string,
	grantee: EngineGrantee,
	usageLimit: ModelUsageLimit | null,
): PermissionBatch =>
	toEngineBatch(engineId, {
		action: "CHANGE",
		subject: {
			category: "ENGINE",
			id: grantee.subject.id,
			type: grantee.subject.type,
		},
		to: toSentGrant({ ...grantee.access, usageLimit }),
	});

/**
 * @param engineId - the engine that gives the permission
 * @param grantee - the engine given it, by its id and catalog type
 * @returns the permission batch that takes away the engine's permission
 */
export const toRemoveEngineBatch = (
	engineId: string,
	grantee: EngineGranteeRef,
): PermissionBatch =>
	toEngineBatch(engineId, {
		action: "REMOVE",
		subject: { category: "ENGINE", id: grantee.id, type: grantee.type },
	});
