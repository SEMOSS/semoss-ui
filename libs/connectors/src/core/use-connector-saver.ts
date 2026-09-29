import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import type {
	ConnectorViewerProps,
	ConnectorViewerService,
} from "./connector.types";
import { type ConnectorSaveSource, saveToInsight } from "./connector-files";
import {
	classifyConnectorError,
	getConnectorErrorKey,
} from "./connector-pixel";

/** One item to save. */
export interface ConnectorSaveRequest {
	/** Identifies the item, so its row can show that it is being saved. */
	key: string;
	/** The item's name, for messages. */
	name: string;
	/** How to put it into the insight's files. */
	source: ConnectorSaveSource;
}

/** What {@link useConnectorSaver} returns. */
export interface ConnectorSaver {
	/** The save action's label, such as `Save to Chat files`. */
	saveLabel: string;
	/** Whether the item with this key is being saved. */
	isBusy: (key: string) => boolean;
	/** Save an item into the insight's files. */
	save: (request: ConnectorSaveRequest) => void;
	/**
	 * Save an item, then add it to the conversation. Undefined when the host
	 * takes nothing into its context, so the action can be left out.
	 */
	addToContext?: (request: ConnectorSaveRequest) => void;
}

/**
 * Save items from a viewer into the current insight's files, and hand them to
 * the host: to its context, or to whatever it does with a saved file.
 *
 * Failures are shown as toasts. A save that finishes after the viewer is gone
 * still reaches the host, because the file exists by then.
 *
 * @param service - The viewer saving the items.
 * @param host - What the host passed the viewer.
 * @return The save actions.
 */
export const useConnectorSaver = (
	service: ConnectorViewerService,
	host: ConnectorViewerProps,
): ConnectorSaver => {
	const { saveTargetName, onSaved, onAddToContext } = host;
	const { insightId } = useInsight();
	const { t } = useTranslation("connectors");
	const [busyKeys, setBusyKeys] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	// read synchronously, so a second click before the first render is ignored
	const runningKeysRef = useRef(new Set<string>());

	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const run = useCallback(
		async (
			request: ConnectorSaveRequest,
			intent: "save" | "context",
		): Promise<void> => {
			if (!insightId) {
				toast.error(
					t("actions.saveError", {
						name: request.name,
						message: t("errors.noInsight"),
					}),
				);
				return;
			}

			if (runningKeysRef.current.has(request.key)) {
				return;
			}
			runningKeysRef.current.add(request.key);
			setBusyKeys((previous) => new Set(previous).add(request.key));
			try {
				const file = await saveToInsight(
					insightId,
					service,
					request.source,
				);
				if (intent === "context" && onAddToContext) {
					onAddToContext(file);
				} else if (onSaved) {
					onSaved(file);
				} else {
					toast.success(t("actions.saved", { name: file.name }));
				}
			} catch (error) {
				const info = classifyConnectorError(error);
				toast.error(
					t(
						intent === "context"
							? "actions.contextError"
							: "actions.saveError",
						{
							name: request.name,
							message: t(getConnectorErrorKey(info), {
								message: info.message,
							}),
						},
					),
				);
			} finally {
				runningKeysRef.current.delete(request.key);
				if (isMountedRef.current) {
					setBusyKeys((previous) => {
						const next = new Set(previous);
						next.delete(request.key);
						return next;
					});
				}
			}
		},
		[insightId, onAddToContext, onSaved, service, t],
	);

	const save = useCallback(
		(request: ConnectorSaveRequest) => {
			void run(request, "save");
		},
		[run],
	);

	const addToContext = useCallback(
		(request: ConnectorSaveRequest) => {
			void run(request, "context");
		},
		[run],
	);

	return {
		saveLabel: saveTargetName
			? t("actions.saveTo", { target: saveTargetName })
			: t("actions.save"),
		isBusy: (key) => busyKeys.has(key),
		save: save,
		addToContext: onAddToContext ? addToContext : undefined,
	};
};
