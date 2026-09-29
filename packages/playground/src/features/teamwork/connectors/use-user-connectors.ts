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
	const [services, setServices] = useState<ConnectorServiceId[]>([]);
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
		setStatus("loading");
		readUserConnectorTools().then(
			(tools) => {
				if (!isCancelled) {
					setServices(
						tools === null ? [] : getConnectorServices(tools),
					);
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

	const setService = async (
		serviceId: ConnectorServiceId,
		isOn: boolean,
	): Promise<void> => {
		const next = isOn
			? sanitizeConnectorServices([...services, serviceId])
			: services.filter((id) => id !== serviceId);
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

	const reload = useCallback(() => {
		setReloadCount((count) => count + 1);
	}, []);

	return {
		status: status,
		services: services,
		isSaving: isSaving,
		setService: setService,
		reload: reload,
	};
};
