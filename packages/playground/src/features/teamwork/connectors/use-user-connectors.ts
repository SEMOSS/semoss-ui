import { useCallback, useEffect, useRef, useState } from "react";
import {
	type ConnectorServiceId,
	getConnectorServices,
	sanitizeConnectorServices,
} from "./connector.catalog";
import {
	readUserConnectorTools,
	writeUserConnectorTools,
} from "./connectors.api";

/** What {@link useUserConnectors} returns. */
export interface UseUserConnectorsResult {
	/** How reading the user's connectors went. */
	status: "loading" | "ready" | "error";
	/** The services switched on for the user, in every chat. */
	services: ConnectorServiceId[];
	/** Whether a change is being saved. */
	isSaving: boolean;
	/**
	 * Switch one service on or off in all the user's chats, new and existing.
	 *
	 * @throws Error when the change cannot be saved.
	 */
	setService: (serviceId: ConnectorServiceId, isOn: boolean) => Promise<void>;
	/**
	 * Switch several services on at once, keeping the ones already on. Does
	 * nothing until the user's connectors have been read, so a write never
	 * replaces settings it has not seen.
	 *
	 * @throws Error when the change cannot be saved.
	 */
	enableServices: (
		serviceIds: readonly ConnectorServiceId[],
	) => Promise<void>;
	/**
	 * Switch several services off at once, keeping the others as they are.
	 * Like `enableServices`, does nothing until the connectors have been read.
	 *
	 * @throws Error when the change cannot be saved.
	 */
	disableServices: (
		serviceIds: readonly ConnectorServiceId[],
	) => Promise<void>;
	/** Read them again. */
	reload: () => void;
}

/**
 * The user's connectors, read from and written to their own file, for a page
 * that has no chat of its own, such as Connections.
 *
 * @return The services and the actions that change them.
 */
export const useUserConnectors = (): UseUserConnectorsResult => {
	const [status, setStatus] =
		useState<UseUserConnectorsResult["status"]>("loading");
	const [services, setServicesState] = useState<ConnectorServiceId[]>([]);
	// read by saves that start after an await, such as the one a sign in
	// makes once its popup closes, when the render's values may be stale
	const servicesRef = useRef<ConnectorServiceId[]>([]);
	const isReadRef = useRef(false);
	const setServices = useCallback((next: ConnectorServiceId[]) => {
		servicesRef.current = next;
		setServicesState(next);
	}, []);
	const [isSaving, setIsSaving] = useState(false);
	const [reloadCount, setReloadCount] = useState(0);

	// a save resolves after a click, possibly after the page is gone
	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reloadCount only asks for a new read
	useEffect(() => {
		let isCancelled = false;
		isReadRef.current = false;
		setStatus("loading");
		readUserConnectorTools().then(
			(tools) => {
				if (!isCancelled) {
					setServices(
						tools === null ? [] : getConnectorServices(tools),
					);
					isReadRef.current = true;
					setStatus("ready");
				}
			},
			() => {
				if (!isCancelled) {
					setStatus("error");
				}
			},
		);
		return () => {
			isCancelled = true;
		};
	}, [reloadCount]);

	const save = async (next: ConnectorServiceId[]): Promise<void> => {
		setIsSaving(true);
		try {
			const tools = await writeUserConnectorTools(next);
			if (isMountedRef.current) {
				setServices(getConnectorServices(tools));
			}
		} finally {
			if (isMountedRef.current) {
				setIsSaving(false);
			}
		}
	};

	const setService = (
		serviceId: ConnectorServiceId,
		isOn: boolean,
	): Promise<void> => {
		const current = servicesRef.current;
		return save(
			isOn
				? sanitizeConnectorServices([...current, serviceId])
				: current.filter((id) => id !== serviceId),
		);
	};

	const enableServices = async (
		serviceIds: readonly ConnectorServiceId[],
	): Promise<void> => {
		const current = servicesRef.current;
		if (
			!isReadRef.current ||
			serviceIds.every((id) => current.includes(id))
		) {
			return;
		}
		await save(sanitizeConnectorServices([...current, ...serviceIds]));
	};

	const disableServices = async (
		serviceIds: readonly ConnectorServiceId[],
	): Promise<void> => {
		const current = servicesRef.current;
		if (
			!isReadRef.current ||
			!serviceIds.some((id) => current.includes(id))
		) {
			return;
		}
		await save(current.filter((id) => !serviceIds.includes(id)));
	};

	const reload = useCallback(() => {
		setReloadCount((count) => count + 1);
	}, []);

	return {
		status: status,
		services: services,
		isSaving: isSaving,
		setService: setService,
		enableServices: enableServices,
		disableServices: disableServices,
		reload: reload,
	};
};
