import { makeAutoObservable, observable, runInAction } from "mobx";
import type { ConnectorViewerService } from "@semoss/connectors";
import { getI18n } from "@semoss/i18n";
import { isSameArray } from "@semoss/utility/array";
import type { RoomStore } from "@/stores/room/room.store";
import {
	CONNECTOR_PROVIDERS,
	type ConnectorProviderId,
	type ConnectorServiceId,
	getConnectorServices,
	isProviderOffered as isOfferedByServer,
	type McpTool,
} from "./connector.catalog";
import { isServiceCovered as isCoveredByServer } from "./connector-access";
import {
	loadRoomTools,
	readUserConnectorTools,
	syncRoomConnectorTools,
} from "./connector-tools";
import {
	CONNECTOR_SOURCES,
	type ConnectorSource,
	getConnectorSource,
} from "./sources/connector-sources";

/**
 * Whether two provider lists, or the null that stands for "not known yet",
 * name the same providers in the same order.
 */
const isSameProviderList = (
	a: readonly ConnectorProviderId[] | null,
	b: readonly ConnectorProviderId[] | null,
): boolean => a === b || (a !== null && b !== null && isSameArray(a, b));

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
 * connectors through {@link ConnectorsStore.adopt}.
 */
export class ConnectorsStore {
	/** The connector services switched on for the user, in every chat. */
	services: ConnectorServiceId[] = [];

	/** Whether the connectors are being written to the room. */
	isSavingConnectors = false;

	/**
	 * The providers the session holds a login for, or null until they have
	 * been read.
	 */
	connectedProviders: ConnectorProviderId[] | null = null;

	/** Accounts whose sign in prompt the user put away until the page reloads. */
	dismissedSignIns: ConnectorProviderId[] = [];

	/**
	 * Which connector apps each OAuth sign in lets the connectors use, as
	 * `connectorAccess` in `/api/config` reports it, or null until read or when
	 * the backend does not say. The server judges it from the scopes the sign
	 * in asks for; the scopes themselves are never sent.
	 */
	connectorAccess: unknown = null;

	/** The providers this server offers signing in with, or null until read. */
	offeredProviders: ConnectorProviderId[] | null = null;

	/**
	 * Accounts whose missing permissions notice the user put away until the
	 * page reloads.
	 */
	dismissedScopeNotices: ConnectorProviderId[] = [];

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

		makeAutoObservable<ConnectorsStore, "room" | "stateVersion">(this, {
			room: false,
			stateVersion: false,
			services: observable.ref,
			connectedProviders: observable.ref,
			dismissedSignIns: observable.ref,
			connectorAccess: observable.ref,
			offeredProviders: observable.ref,
			dismissedScopeNotices: observable.ref,
		});
	}

	/**
	 * Whether this is the new-chat page's draft rather than a real room. A
	 * draft has no insight, so nothing is persisted or written for it.
	 */
	get isDraft(): boolean {
		return this.room.insightId === "new";
	}

	/**
	 * The viewers the plus menu offers: each needs its connector switched on
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
		runInAction(() => {
			this.stateVersion++;
			this.services = getConnectorServices(userTools);
			this.isSavingConnectors = !this.isDraft;
		});
		if (this.isDraft) {
			return;
		}
		try {
			await syncRoomConnectorTools(this.room, userTools);
		} finally {
			runInAction(() => {
				this.isSavingConnectors = false;
			});
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
		runInAction(() => {
			this.stateVersion++;
			this.services = [...draft.services];
		});
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
	 * @return Settles when all is in place. Never rejects.
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
	 * @return Settles once they are read. Never rejects.
	 */
	loadUserConnectors = async (): Promise<void> => {
		const version = this.stateVersion;
		try {
			const userTools = await readUserConnectorTools();
			runInAction(() => {
				if (this.stateVersion === version) {
					this.services =
						userTools === null
							? []
							: getConnectorServices(userTools);
				}
			});
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
		if (!isSameProviderList(this.connectedProviders, connected)) {
			this.connectedProviders = connected;
		}
		if (connectorAccess !== undefined && connectorAccess !== null) {
			this.connectorAccess = connectorAccess;
		}
		if (Array.isArray(availableProviders)) {
			const offered = CONNECTOR_PROVIDERS.filter((provider) =>
				isOfferedByServer(availableProviders, provider),
			).map((provider) => provider.id);
			if (!isSameProviderList(this.offeredProviders, offered)) {
				this.offeredProviders = offered;
			}
		}
	};

	/**
	 * Put a sign in prompt away until the page reloads.
	 *
	 * @param providerId - The provider whose prompt to hide.
	 */
	dismissSignIn = (providerId: ConnectorProviderId): void => {
		if (!this.dismissedSignIns.includes(providerId)) {
			this.dismissedSignIns = [...this.dismissedSignIns, providerId];
		}
	};

	/**
	 * Put a missing permissions notice away until the page reloads.
	 *
	 * @param providerId - The provider whose notice to hide.
	 */
	dismissScopeNotice = (providerId: ConnectorProviderId): void => {
		if (!this.dismissedScopeNotices.includes(providerId)) {
			this.dismissedScopeNotices = [
				...this.dismissedScopeNotices,
				providerId,
			];
		}
	};

	/**
	 * Whether this server offers signing in with a provider. True while that
	 * is not known.
	 *
	 * @param providerId - The provider.
	 * @return False only when the server is known not to offer it.
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
	 * @return False only when the server says the sign in cannot cover it.
	 */
	isServiceCovered = (serviceId: ConnectorServiceId): boolean =>
		isCoveredByServer(serviceId, this.connectorAccess);

	/**
	 * Show a Microsoft 365 viewer in the room's sidebar.
	 *
	 * @param service - The viewer to show.
	 */
	openSourcePanel = (service: ConnectorViewerService): void => {
		const source = getConnectorSource(service);
		this.room.openSidebarPanel(
			source.panelType,
			{},
			getI18n().t(source.nameKey),
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
		runInAction(() => {
			this.services = services;
		});
		if (userTools !== null && !isNew) {
			await syncRoomConnectorTools(this.room, userTools);
		}
	};
}
