import type {
	CurrentAccess,
	EngineAccessChange,
	EngineGranteeType,
	EngineSubject,
	ModelUsageLimit,
	PermissionBatch,
} from "@semoss/sdk";
import { toSentGrant } from "@/features/bulk-access-management/permission-batch";
import type { GrantLevel, GrantTargetType } from "./grant-levels";

/** The engine or project that gives a permission */
export interface GrantTarget {
	/** ENGINE for an engine, PROJECT for a project such as a skill or an app */
	resourceType: GrantTargetType;
	/** Its id */
	id: string;
}

/** An app, an agent or an engine given a permission, by its id and catalog type */
export interface GranteeRef {
	/** Its id */
	id: string;
	/** Its catalog type, PROJECT for an app or an agent */
	type: EngineGranteeType;
}

/** An app, an agent or an engine with the permission it is given */
export type Grantee = CurrentAccess<EngineSubject>;

/** What a grantee's usage limit needs on a model */
export interface GrantModel {
	/** Whether the model has known prices, so the limit can have cost rules */
	isCostAvailable: boolean;
	/** Whether the user can set the limit: the model's owners, and admins in admin mode */
	canChangeLimit: boolean;
}

/**
 * @param grantee - an app, agent or engine with a permission
 * @returns whether it is an agent, whose runs use the permission
 */
export const isAgent = (grantee: Grantee): boolean =>
	grantee.subject.type === "PROJECT" &&
	grantee.subject.subtype === "WORKSPACE";

/**
 * @param target - the engine or project that gives the permission
 * @param grantee - the one given it
 * @returns a key naming the pair, as an engine and a project may share an id
 */
export const granteeKey = (target: GrantTarget, grantee: GranteeRef): string =>
	`${target.resourceType}:${target.id}|${grantee.type}:${grantee.id}`;

/**
 * @param target - the engine or project
 * @param change - one change to a grantee's permission on it
 * @returns the permission batch that makes the change
 */
const toGrantBatch = (
	target: GrantTarget,
	change: EngineAccessChange,
): PermissionBatch => ({
	target: { resourceType: target.resourceType, id: target.id },
	changes: [change],
});

/**
 * The permission batch that gives apps, agents or engines a permission on an
 * engine or a project, all at one level and, on a model, each with the same
 * usage limit. The changes go in one batch, so they are saved together or not
 * at all. No limit defined leaves the limit out, as it is for anything that is
 * not a model.
 *
 * @param target - the engine or project
 * @param grantees - the ones given it, by their ids and catalog types
 * @param level - the level each one gets
 * @param usageLimit - on a model, each one's usage limit, or null for no limit defined
 * @returns the batch to save
 */
export const toAddGranteesBatch = (
	target: GrantTarget,
	grantees: readonly GranteeRef[],
	level: GrantLevel,
	usageLimit: ModelUsageLimit | null = null,
): PermissionBatch => ({
	target: { resourceType: target.resourceType, id: target.id },
	changes: grantees.map(
		(grantee): EngineAccessChange => ({
			action: "ADD",
			subject: { category: "ENGINE", id: grantee.id, type: grantee.type },
			to: toSentGrant({ level, endDate: null, usageLimit }),
		}),
	),
});

/**
 * The permission batch that changes a grantee's level or a model's usage limit.
 * A change sets the whole permission, so what is not changed is carried forward
 * as it is; no limit defined leaves the limit out.
 *
 * @param target - the engine or project
 * @param grantee - the one given the permission, with its current permission
 * @param to - the new level, the new usage limit, or both
 * @returns the batch to save
 */
export const toGranteeChangeBatch = (
	target: GrantTarget,
	grantee: Grantee,
	to: { level?: GrantLevel; usageLimit?: ModelUsageLimit | null },
): PermissionBatch =>
	toGrantBatch(target, {
		action: "CHANGE",
		subject: {
			category: "ENGINE",
			id: grantee.subject.id,
			type: grantee.subject.type,
		},
		to: toSentGrant({ ...grantee.access, ...to }),
	});

/**
 * @param target - the engine or project
 * @param grantee - the one given the permission, by its id and catalog type
 * @returns the permission batch that takes the permission away
 */
export const toRemoveGranteeBatch = (
	target: GrantTarget,
	grantee: GranteeRef,
): PermissionBatch =>
	toGrantBatch(target, {
		action: "REMOVE",
		subject: { category: "ENGINE", id: grantee.id, type: grantee.type },
	});
