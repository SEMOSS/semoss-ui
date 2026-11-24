import type { ConfigStore } from "@semoss/sdk";
import { useConfig } from "@semoss/sdk/react";
import type { Engine, Project } from "@semoss/shared";
import {
	getTypePlural,
	toEngineTypeOptions,
	toProjectTypeOptions,
} from "@/features/grants/grant-types";
import {
	GRANT_KINDS,
	type GrantKind,
	type GrantSide,
	SHARED_ENGINE_TYPES,
	SHARED_PROJECT_TYPES,
} from "./grant-pairs";

/** What the user can share, by the config's admin-only settings */
export interface ShareableKinds {
	/**
	 * The kinds of access the user can give. In admin mode, every kind; outside
	 * it, each kind's shared side has only the types the user can share, and a
	 * kind with none is left out.
	 */
	kinds: readonly GrantKind[];
	/**
	 * Says which types only admins can share, such as "Only admins can give
	 * access to models and guardrails, ...", or null in admin mode and when the
	 * user can share every type
	 */
	adminOnlyNote: string | null;
}

/**
 * @param type - a project's type
 * @returns the config resource whose give-access setting covers it: agents and
 * skills have their own, every other project type the projects' one
 */
const toAdminOnlyResource = (
	type: Project["project_type"],
): Parameters<ConfigStore["isAdminOnly"]>[0] =>
	type === "WORKSPACE" || type === "SKILL" ? type : "PROJECT";

/**
 * Works out what the user can give on the Resource Delegated Access page. Only
 * admins in admin mode give access to a type whose give-access setting is kept
 * for admins, such as models when the config says so; the backend refuses it
 * outside admin mode, admins included. So outside admin mode, each kind of
 * access offers only the types the user can share, a kind with none is not
 * offered, and a note names what is left for admins. The config is read once
 * for the page and shared.
 *
 * @param admin - whether the page is in admin mode, where every type can be shared
 * @returns the kinds the user can give, and the note
 */
export const useShareableKinds = (admin: boolean): ShareableKinds => {
	const adminOnlyProjectTypes = useConfig<Project["project_type"][]>(
		(state) =>
			admin
				? []
				: SHARED_PROJECT_TYPES.filter((type) =>
						state.isAdminOnly(toAdminOnlyResource(type), "access"),
					),
	);
	const adminOnlyEngineTypes = useConfig<Engine["engine_type"][]>((state) =>
		admin
			? []
			: SHARED_ENGINE_TYPES.filter((type) =>
					state.isAdminOnly(type, "access"),
				),
	);

	const narrow = (side: GrantSide): GrantSide => {
		if (side.kind === "PROJECT") {
			const types = side.types.filter(
				(type) => !adminOnlyProjectTypes.includes(type),
			);
			return { ...side, types, typeOptions: toProjectTypeOptions(types) };
		}
		const types = side.types.filter(
			(type) => !adminOnlyEngineTypes.includes(type),
		);
		return { ...side, types, typeOptions: toEngineTypeOptions(types) };
	};
	const kinds = GRANT_KINDS.map((kind) => ({
		...kind,
		target: narrow(kind.target),
	})).filter((kind) => kind.target.types.length > 0);

	const names = [
		...new Set([
			...adminOnlyProjectTypes.map((type) =>
				getTypePlural("PROJECT", type),
			),
			...adminOnlyEngineTypes.map((type) =>
				getTypePlural("ENGINE", type),
			),
		]),
	];
	if (names.length === 0) {
		return { kinds, adminOnlyNote: null };
	}
	const list = new Intl.ListFormat("en", { type: "conjunction" }).format(
		names,
	);
	return {
		kinds,
		adminOnlyNote: `Only admins can give access to ${list}, from All Resource Delegated Access in admin mode.`,
	};
};
