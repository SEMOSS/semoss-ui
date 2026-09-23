import {
	getUserEnginePermission,
	getUserProjectPermission,
} from "../../../api";
import type { Role } from "../../../types";
import type {
	AccessEntry,
	ResourceType,
	SessionState,
	SystemConfig,
} from "../session.types";

const emptyEntries = (): SessionState["access"]["entries"] => ({
	ENGINE: {},
	PROJECT: {},
	INSIGHT: {},
});

const toError = (error: unknown): Error =>
	error instanceof Error ? error : new Error(String(error));

const requestPermission = (type: ResourceType, id: string): Promise<Role> => {
	if (type === "ENGINE") {
		return getUserEnginePermission(id);
	}
	if (type === "PROJECT") {
		return getUserProjectPermission(id);
	}
	return Promise.resolve("EDIT");
};

/** Build the access slice shared by full sessions and standalone hosts. */
export const createAccessSlice = ({
	setAccess,
	getAccess,
	getSession,
}: {
	setAccess: (
		update: (access: SessionState["access"]) => SessionState["access"],
	) => void;
	getAccess: () => SessionState["access"];
	getSession?: () => Pick<SessionState, "config" | "user">;
}): SessionState["access"] => {
	let generation = 0;
	const inFlight = new Map<string, Promise<Role>>();

	const write = (
		type: ResourceType,
		id: string,
		entry: AccessEntry,
		requestGeneration: number,
	): void => {
		if (requestGeneration !== generation) {
			return;
		}

		setAccess((access) => ({
			...access,
			entries: {
				...access.entries,
				[type]: { ...access.entries[type], [id]: entry },
			},
		}));
	};

	const fetchPermission = (
		type: ResourceType,
		id: string,
		force: boolean,
	): Promise<Role> => {
		const current = getAccess().entries[type][id];
		if (!force && current?.permission) {
			return Promise.resolve(current.permission);
		}

		const key = `${type}:${id}`;
		const pending = inFlight.get(key);
		if (pending) {
			return pending;
		}

		const requestGeneration = generation;
		write(
			type,
			id,
			{ status: "loading", permission: current?.permission },
			requestGeneration,
		);

		const request = requestPermission(type, id)
			.then((permission) => {
				write(
					type,
					id,
					{ status: "ready", permission },
					requestGeneration,
				);
				return permission;
			})
			.catch((error: unknown) => {
				write(
					type,
					id,
					{
						status: "error",
						permission: current?.permission,
						error: toError(error),
					},
					requestGeneration,
				);
				throw error;
			})
			.finally(() => {
				if (inFlight.get(key) === request) {
					inFlight.delete(key);
				}
			});

		inFlight.set(key, request);
		return request;
	};

	return {
		entries: emptyEntries(),
		actions: {
			loadPermission: (type, id) => fetchPermission(type, id, false),
			refreshPermission: (type, id) => fetchPermission(type, id, true),
			primePermission: (type, id, permission) => {
				const current = getAccess().entries[type][id];
				if (current?.status === "loading") {
					return;
				}
				if (
					current?.status === "ready" &&
					current.permission === permission
				) {
					return;
				}
				write(type, id, { status: "ready", permission }, generation);
			},
			clearPermissions: () => {
				generation += 1;
				inFlight.clear();
				setAccess((access) => ({ ...access, entries: emptyEntries() }));
			},
			isOperationAvailable: (type, operation) => {
				const session = getSession?.();
				if (session?.user.current?.admin) {
					return true;
				}
				if (!session?.config.data || type === "GUARDRAIL") {
					return false;
				}

				const moduleNames = {
					PROJECT: "Project",
					WORKSPACE: "Workspace",
					SKILL: "Skill",
					DATABASE: "Db",
					FUNCTION: "Function",
					MODEL: "Model",
					STORAGE: "Storage",
					VECTOR: "Vector",
				} as const;
				const operationNames = {
					access: "AddAccess",
					add: "Add",
					delete: "Delete",
					discoverable: "SetDiscoverable",
					public: "SetPublic",
				} as const;
				const key = `adminOnly${moduleNames[type]}${operationNames[operation]}`;
				return session.config.data[key as keyof SystemConfig] === false;
			},
		},
	};
};
