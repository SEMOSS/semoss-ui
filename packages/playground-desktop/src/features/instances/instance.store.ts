import { Observable } from "@semoss/utility/observable";
import type { AppStore } from "../../platform/app-store";

/** How the user last signed in to an instance, so it is offered first. */
export type LoginMethod = "native" | "oauth" | "otp" | "bearer";

/** A SEMOSS instance the user saved. */
export interface InstanceProfile {
	/** Stable id; also the keychain account its secrets are kept under. */
	id: string;
	/** The name the picker shows. */
	name: string;
	/** The server's origin, such as `https://semoss.example.com`. */
	url: string;
	/** The deployment's path, such as `/Monolith`. */
	module: string;
	/** How the user last signed in. */
	lastLoginMethod?: LoginMethod;
	/** The provider a bearer token is for, if the user signs in with one. */
	bearerProvider?: string;
}

/** What {@link InstanceStore} holds. */
export interface InstanceState {
	/** The saved instances, in the order they were added. */
	instances: InstanceProfile[];
	/** The instance in use, or null to pick one. */
	activeInstanceId: string | null;
	/** Whether the saved instances have been read. */
	status: "LOADING" | "READY";
}

/** What the preferences file keeps of the instances. */
interface StoredInstances {
	instances: InstanceProfile[];
	activeInstanceId: string | null;
}

/**
 * Whether a value read from the preferences file is the instances' shape.
 *
 * @param value - The stored value.
 * @returns True when it can be used.
 */
const isStoredInstances = (value: unknown): value is StoredInstances => {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const { instances, activeInstanceId } = value as Record<string, unknown>;
	return (
		Array.isArray(instances) &&
		instances.every(
			(instance) =>
				typeof instance === "object" &&
				instance !== null &&
				typeof (instance as InstanceProfile).id === "string" &&
				typeof (instance as InstanceProfile).url === "string" &&
				typeof (instance as InstanceProfile).module === "string",
		) &&
		(activeInstanceId === null || typeof activeInstanceId === "string")
	);
};

/**
 * Normalize what the user typed into an instance's origin and module path.
 *
 * @param url - The server address, with or without a path.
 * @param module - The deployment's path; `/Monolith` when empty.
 * @returns The origin and the module path.
 * @throws Error for an address that is not http(s), or http other than
 * localhost.
 */
export const normalizeInstanceAddress = (
	url: string,
	module: string,
): { url: string; module: string } => {
	let parsed: URL;
	try {
		parsed = new URL(url.trim());
	} catch {
		throw new Error("Enter the server's full address, such as https://…");
	}
	const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(
		parsed.hostname,
	);
	if (
		parsed.protocol !== "https:" &&
		!(parsed.protocol === "http:" && isLocal)
	) {
		throw new Error("The server must use https (http only for localhost).");
	}
	const path = (module.trim() || "/Monolith").replace(/\/+$/, "");
	return {
		url: parsed.origin,
		module: path.startsWith("/") ? path : `/${path}`,
	};
};

/**
 * The instance's module address, which every SDK request starts with.
 *
 * @param instance - The instance.
 * @returns Such as `https://host/Monolith`.
 */
export const getModuleUrl = (
	instance: Pick<InstanceProfile, "url" | "module">,
): string => `${instance.url}${instance.module}`;

/**
 * The SEMOSS instances the user saved and the one in use, kept in the app's
 * preferences file. Switching instances reloads the app (see the package
 * guide), so the SDK, its session and every room start over against the new
 * server.
 */
export class InstanceStore {
	private readonly state = new Observable<InstanceState>({
		instances: [],
		activeInstanceId: null,
		status: "LOADING",
	});

	/**
	 * @param store - The app's preferences.
	 */
	constructor(private readonly store: AppStore) {}

	getSnapshot = (): InstanceState => this.state.getSnapshot();

	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The instance in use, if one is picked. */
	get activeInstance(): InstanceProfile | null {
		const { instances, activeInstanceId } = this.state.getSnapshot();
		return instances.find((item) => item.id === activeInstanceId) ?? null;
	}

	/** Read the saved instances; a missing or corrupt file reads as none. */
	load = async (): Promise<void> => {
		let stored: unknown;
		try {
			stored = await this.store.get("instances");
		} catch {
			stored = undefined;
		}
		const { instances, activeInstanceId } = isStoredInstances(stored)
			? stored
			: { instances: [], activeInstanceId: null };
		this.state.set({
			instances: instances,
			activeInstanceId: instances.some(
				(item) => item.id === activeInstanceId,
			)
				? activeInstanceId
				: null,
			status: "READY",
		});
	};

	/**
	 * Save an instance, new or edited.
	 *
	 * @param instance - The instance; an existing id replaces that one.
	 */
	saveInstance = async (instance: InstanceProfile): Promise<void> => {
		const { instances } = this.state.getSnapshot();
		const exists = instances.some((item) => item.id === instance.id);
		await this.write({
			instances: exists
				? instances.map((item) =>
						item.id === instance.id ? instance : item,
					)
				: [...instances, instance],
		});
	};

	/**
	 * Forget an instance; the one in use is put away too.
	 *
	 * @param id - The instance.
	 */
	removeInstance = async (id: string): Promise<void> => {
		const { instances, activeInstanceId } = this.state.getSnapshot();
		await this.write({
			instances: instances.filter((item) => item.id !== id),
			activeInstanceId: activeInstanceId === id ? null : activeInstanceId,
		});
	};

	/**
	 * Choose the instance to use, or none to go back to the picker.
	 *
	 * @param id - The instance, or null.
	 */
	setActiveInstance = async (id: string | null): Promise<void> => {
		await this.write({ activeInstanceId: id });
	};

	/**
	 * Remember how the user signed in to the instance in use.
	 *
	 * @param method - The sign in method.
	 * @param bearerProvider - A bearer token's provider.
	 */
	recordLogin = async (
		method: LoginMethod,
		bearerProvider?: string,
	): Promise<void> => {
		const active = this.activeInstance;
		if (!active) {
			return;
		}
		await this.saveInstance({
			...active,
			lastLoginMethod: method,
			bearerProvider: method === "bearer" ? bearerProvider : undefined,
		});
	};

	/**
	 * Update the state and the preferences file.
	 *
	 * @param next - What changes.
	 */
	private write = async (
		next: Partial<Omit<InstanceState, "status">>,
	): Promise<void> => {
		const current = this.state.getSnapshot();
		const state = { ...current, ...next };
		this.state.set(state);
		await this.store.set("instances", {
			instances: state.instances,
			activeInstanceId: state.activeInstanceId,
		} satisfies StoredInstances);
	};
}
