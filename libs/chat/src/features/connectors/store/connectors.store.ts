import type { ConnectorViewerService } from "@semoss/connectors";
import { getI18n } from "@semoss/i18n";
import { isSameArray } from "@semoss/utility/array";
import { StoreState } from "@semoss/utility/store";
import type { RoomStore } from "../../room/store/room.store";
import { NEW_INSIGHT_ID } from "../../room/store/room-placeholders";
import type { McpTool } from "../../tools/chat-tools/chat-tool-info";
import {
	CONNECTOR_SOURCES,
	type ConnectorSource,
	getConnectorSource,
} from "../viewers/connector-sources";
import { isServiceCovered as isCoveredByServer } from "./connector-access";
import {
	CONNECTOR_PROVIDERS,
	type ConnectorProviderId,
	type ConnectorServiceId,
	isProviderOffered as isOfferedByServer,
} from "./connector-catalog";
import {
	getConnectorServices,
	loadRoomTools,
	readUserConnectorTools,
	syncRoomConnectorTools,
} from "./connector-tools";

/**
 * Whether two provider lists, or the null that stands for "not known yet",
 * name the same providers in the same order.
 *
 * @param a - One list.
 * @param b - The other.
 * @returns True when they match.
 */
const isSameProviderList = (
	a: readonly ConnectorProviderId[] | null,
	b: readonly ConnectorProviderId[] | null,
): boolean => a === b || (a !== null && b !== null && isSameArray(a, b));

/** What {@link ConnectorsStore} holds. */
export interface ConnectorsSnapshot {
	/** The connector services switched on for the user, in every chat. */
	readonly services: readonly ConnectorServiceId[];
	/** Whether the connectors are being written to the room. */
	readonly isSavingConnectors: boolean;
	/**
	 * The providers the session holds a login for, or null until they have
	 * been read.
	 */
	readonly connectedProviders: readonly ConnectorProviderId[] | null;
	/** Accounts whose sign in prompt the user put away until the page reloads. */
	readonly dismissedSignIns: readonly ConnectorProviderId[];
	/**
	 * Which connector apps each OAuth sign in lets the connectors use, as
	 * `connectorAccess` in `/api/config` reports it, or null until read or when
	 * the backend does not say. The server judges it from the scopes the sign
	 * in asks for; the scopes themselves are never sent.
	 */
	readonly connectorAccess: unknown;
	/** The providers this server offers signing in with, or null until read. */
	readonly offeredProviders: readonly ConnectorProviderId[] | null;
	/**
	 * Accounts whose missing permissions notice the user put away until the
	 * page reloads.
	 */
	readonly dismissedScopeNotices: readonly ConnectorProviderId[];
}

/** A room's connectors before anything is read: none switched on, nothing known. */
const INITIAL: ConnectorsSnapshot = {
	services: [],
	isSavingConnectors: false,
	connectedProviders: null,
	dismissedSignIns: [],
	connectorAccess: null,
	offeredProviders: null,
	dismissedScopeNotices: [],
};

/**
 * One room's connectors: the Microsoft 365 and Google Workspace services
 * switched on, and the accounts they sign in with.
 *
 * The connectors are the user's, not the room's: they live in the user's own
 * folder (`mcp/playground_connector_mcp.json`), stamped
 * `SMSS_MCP_GENERATOR: PlaygroundConnectors`, and each room holds a copy in
 * its tool file, made before its first message and brought up to date
 * whenever it loads.
 *
 * Owned by the room store, and so as long lived as the room. The new-chat page
 * drafts one on its temporary room; the room it creates takes the user's
 * connectors through {@link ConnectorsStore.adopt}. React reads it with
 * `useConnectors`.
 */
export class ConnectorsStore {
	/** The store's state; only its own actions write it. */
	private readonly state = new StoreState<ConnectorsSnapshot>(INITIAL);

	/**
	 * The current snapshot.
	 *
	 * @returns What the store holds now.
	 */
	getSnapshot = (): ConnectorsSnapshot => this.state.getSnapshot();

	/**
	 * Hear about every change.
	 *
	 * @param listener - Called after each change.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The connector services switched on for the user, in every chat. */
	get services(): readonly ConnectorServiceId[] {
		return this.state.getSnapshot().services;
	}

	/** Whether the connectors are being written to the room. */
	get isSavingConnectors(): boolean {
		return this.state.getSnapshot().isSavingConnectors;
	}

	/** The providers the session holds a login for, or null until read. */
	get connectedProviders(): readonly ConnectorProviderId[] | null {
		return this.state.getSnapshot().connectedProviders;
	}

	/** Accounts whose sign in prompt the user put away. */
	get dismissedSignIns(): readonly ConnectorProviderId[] {
		return this.state.getSnapshot().dismissedSignIns;
	}

	/** What the server says each sign in lets the connectors use. */
	get connectorAccess(): unknown {
		return this.state.getSnapshot().connectorAccess;
	}

	/** The providers this server offers signing in with, or null until read. */
	get offeredProviders(): readonly ConnectorProviderId[] | null {
		return this.state.getSnapshot().offeredProviders;
	}

	/** Accounts whose missing permissions notice the user put away. */
	get dismissedScopeNotices(): readonly ConnectorProviderId[] {
		return this.state.getSnapshot().dismissedScopeNotices;
	}

	/** The room whose tool file holds the copy and whose Workbench shows the viewers. */
	private readonly room: RoomStore;

	/**
	 * Bumped by every change the user makes, so a restore that finishes late
	 * does not overwrite connectors chosen while it ran.
	 */
	private stateVersion = 0;

	/**
	 * @param room - The room this state belongs to.
	 */
	constructor(room: RoomStore) {
		this.room = room;
	}

	/**
	 * Switch services on for this chat without writing them anywhere, as a
	 * draft or a test sets them.
	 *
	 * @param services - The services switched on.
	 */
	setServices = (services: readonly ConnectorServiceId[]): void => {
		this.stateVersion++;
		this.state.update({ services });
	};

	/**
	 * Whether this is the new-chat page's draft rather than a real room. A
	 * draft has no insight, so nothing is persisted or written for it.
	 */
	get isDraft(): boolean {
		return this.room.insightId === NEW_INSIGHT_ID;
	}

	/**
	 * The viewers the Workbench rail and the slash menu offer: each needs its connector switched on
	 * for the chat, its account signed in, and the permission it reads with in
	 * the account's sign in, so the viewers show what the assistant can reach.
	 * Until the logins have been read, a switched on connector is enough, since
	 * one can only be switched on while signed in.
	 */
	get availableSources(): ConnectorSource[] {
		const connected = this.connectedProviders;
		return CONNECTOR_SOURCES.filter(
			(source) =>
				this.services.includes(source.requires) &&
				this.isProviderOffered(source.provider) &&
				(connected === null || connected.includes(source.provider)) &&
				this.isServiceCovered(source.requires),
		);
	}

	/**
	 * The chat's switched on connectors whose account's sign in lacks the
	 * permission they read with, by account, so no sign in can make them work
	 * until an administrator adds it. Without the notices the user put away.
	 */
	get uncoveredConnectors(): {
		providerId: ConnectorProviderId;
		services: ConnectorServiceId[];
	}[] {
		return CONNECTOR_PROVIDERS.map((provider) => ({
			providerId: provider.id,
			services: provider.services.filter(
				(service) =>
					this.services.includes(service) &&
					!this.isServiceCovered(service),
			),
		})).filter(
			(entry) =>
				entry.services.length > 0 &&
				!this.dismissedScopeNotices.includes(entry.providerId),
		);
	}

	/**
	 * The accounts this chat's connectors act with that the session is not
	 * signed in to, so the tools the assistant is offered for them would fail.
	 * Empty until the logins have been read, and without the prompts the user
	 * put away.
	 */
	get missingSignIns(): ConnectorProviderId[] {
		const connected = this.connectedProviders;
		if (connected === null) {
			return [];
		}
		return CONNECTOR_PROVIDERS.filter(
			(provider) =>
				this.isProviderOffered(provider.id) &&
				!connected.includes(provider.id) &&
				!this.dismissedSignIns.includes(provider.id) &&
				provider.services.some((service) =>
					this.services.includes(service),
				),
		).map((provider) => provider.id);
	}

	/**
	 * The accounts this chat's connectors act with that this server does not
	 * offer signing in with at all, so no sign in can make them work. Without
	 * the notices the user put away.
	 */
	get unofferedProviders(): ConnectorProviderId[] {
		return CONNECTOR_PROVIDERS.filter(
			(provider) =>
				!this.isProviderOffered(provider.id) &&
				!this.dismissedSignIns.includes(provider.id) &&
				provider.services.some((service) =>
					this.services.includes(service),
				),
		).map((provider) => provider.id);
	}

	/**
	 * Take the user's connector tools, just saved, such as on the settings
	 * page. They are the user's rather than one chat's, so every chat of
	 * theirs takes the change: this one straight away, the others when they
	 * open.
	 *
	 * @param userTools - The connector tools the user's file now holds.
	 * @throws Error when the room's copy cannot be written.
	 */
	applyUserConnectorTools = async (
		userTools: readonly McpTool[],
	): Promise<void> => {
		this.stateVersion++;
		this.state.update({
			services: getConnectorServices(userTools),
			isSavingConnectors: !this.isDraft,
		});
		if (this.isDraft) {
			return;
		}
		try {
			await syncRoomConnectorTools(this.room, userTools);
		} finally {
			this.state.update({ isSavingConnectors: false });
		}
	};

	/**
	 * Copy the user's connectors into the real room a draft became. Called
	 * before the room's first message, so that message already has the tools.
	 *
	 * @param draft - The new-chat page's connectors.
	 * @throws Error when the connectors cannot be copied.
	 */
	adopt = async (draft: ConnectorsStore): Promise<void> => {
		this.stateVersion++;
		this.state.update({ services: [...draft.services] });
		const userTools = await readUserConnectorTools();
		if (userTools !== null) {
			await syncRoomConnectorTools(this.room, userTools);
		}
	};

	/**
	 * Read the user's connectors and bring this room's copy of them up to
	 * date. Called when the room loads, so a chat opened after the user changed
	 * their connectors has the change. The session's logins are not read here:
	 * the SDK keeps them, and `useConnectorLogins` hands them over while a view
	 * shows sign in state.
	 *
	 * @param options - `isNew`: the room was just created, so it has no copy
	 * yet; {@link ConnectorsStore.adopt} makes it before the first message.
	 * @returns Settles when all is in place. Never rejects.
	 */
	restore = async ({
		isNew = false,
	}: {
		isNew?: boolean;
	} = {}): Promise<void> => {
		if (this.isDraft) {
			return;
		}
		try {
			await this.restoreConnectors(isNew);
		} catch (error) {
			console.warn("Could not restore the room's connectors", error);
		}
	};

	/**
	 * Read the user's connectors for the new-chat page's draft, which has no
	 * room to copy them into yet.
	 *
	 * @returns Settles once they are read. Never rejects.
	 */
	loadUserConnectors = async (): Promise<void> => {
		const version = this.stateVersion;
		try {
			const userTools = await readUserConnectorTools();
			if (this.stateVersion === version) {
				this.state.update({
					services:
						userTools === null
							? []
							: getConnectorServices(userTools),
				});
			}
		} catch (error) {
			console.warn("Could not read the user's connectors", error);
		}
	};

	/**
	 * Take what the SDK knows about the session's sign ins: the logins it holds,
	 * from `Logins`, and what the server's config says they allow. Handed over
	 * by `useConnectorLogins` while a view shows sign in state. An unchanged
	 * answer leaves the views that show it alone.
	 *
	 * @param session.logins - The session's logins, or null until they are
	 * known.
	 * @param session.connectorAccess - The config's `connectorAccess`, if any.
	 * @param session.availableProviders - The config's `availableProviders`.
	 */
	setSessionLogins = ({
		logins,
		connectorAccess,
		availableProviders,
	}: {
		logins: Record<string, string> | null;
		connectorAccess: unknown;
		availableProviders: unknown;
	}): void => {
		const connected =
			logins === null
				? null
				: CONNECTOR_PROVIDERS.filter(
						(provider) => provider.loginKey in logins,
					).map((provider) => provider.id);
		this.state.update((current) => {
			const offered = Array.isArray(availableProviders)
				? CONNECTOR_PROVIDERS.filter((provider) =>
						isOfferedByServer(availableProviders, provider),
					).map((provider) => provider.id)
				: current.offeredProviders;
			// an unchanged field keeps its value, which update skips
			return {
				connectedProviders: isSameProviderList(
					current.connectedProviders,
					connected,
				)
					? current.connectedProviders
					: connected,
				connectorAccess:
					connectorAccess === undefined || connectorAccess === null
						? current.connectorAccess
						: connectorAccess,
				offeredProviders: isSameProviderList(
					current.offeredProviders,
					offered,
				)
					? current.offeredProviders
					: offered,
			};
		});
	};

	/**
	 * Put a sign in prompt away until the page reloads.
	 *
	 * @param providerId - The provider whose prompt to hide.
	 */
	dismissSignIn = (providerId: ConnectorProviderId): void => {
		this.addUnique("dismissedSignIns", providerId);
	};

	/**
	 * Put a missing permissions notice away until the page reloads.
	 *
	 * @param providerId - The provider whose notice to hide.
	 */
	dismissScopeNotice = (providerId: ConnectorProviderId): void => {
		this.addUnique("dismissedScopeNotices", providerId);
	};

	/**
	 * Whether this server offers signing in with a provider. True while that
	 * is not known.
	 *
	 * @param providerId - The provider.
	 * @returns False only when the server is known not to offer it.
	 */
	isProviderOffered = (providerId: ConnectorProviderId): boolean =>
		this.offeredProviders === null ||
		this.offeredProviders.includes(providerId);

	/**
	 * Whether this server's sign in lets a service's account use it, as the
	 * server judges from the permissions the sign in asks for. True while that
	 * is not known.
	 *
	 * @param serviceId - The service.
	 * @returns False only when the server says the sign in cannot cover it.
	 */
	isServiceCovered = (serviceId: ConnectorServiceId): boolean =>
		isCoveredByServer(serviceId, this.connectorAccess);

	/**
	 * Show a Microsoft 365 or Google Workspace viewer in the room's Workbench.
	 *
	 * @param service - The viewer to show.
	 */
	openSourcePanel = (service: ConnectorViewerService): void => {
		const source = getConnectorSource(service);
		this.room.openWorkbenchPanel(
			source.panelType,
			{},
			getI18n().t(source.nameKey),
		);
	};

	/**
	 * Add a provider to one of the dismissed lists, keeping the list as it is
	 * when the provider is already on it.
	 *
	 * @param field - The list.
	 * @param providerId - The provider to add.
	 */
	private addUnique = (
		field: "dismissedSignIns" | "dismissedScopeNotices",
		providerId: ConnectorProviderId,
	): void => {
		this.state.set((current) =>
			current[field].includes(providerId)
				? current
				: { ...current, [field]: [...current[field], providerId] },
		);
	};

	/**
	 * Read the user's connectors and bring this room's copy up to date. A user
	 * who has not chosen connectors yet has no file, and their rooms keep the
	 * connectors they have.
	 *
	 * @param isNew - Whether the room was just created and has no copy yet.
	 * @throws Error when a file cannot be read or written.
	 */
	private restoreConnectors = async (isNew: boolean): Promise<void> => {
		const version = this.stateVersion;
		const userTools = await readUserConnectorTools();
		const services =
			userTools === null
				? getConnectorServices(
						isNew ? [] : await loadRoomTools(this.room),
					)
				: getConnectorServices(userTools);
		// a change the user made meanwhile is newer than what was read
		if (this.stateVersion !== version) {
			return;
		}
		this.state.update({ services });
		if (userTools !== null && !isNew) {
			await syncRoomConnectorTools(this.room, userTools);
		}
	};
}
