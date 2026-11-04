import { useCallback, useEffect, useState } from "react";
import { getMcpTools } from "@semoss/sdk";
import type { MCPConfig } from "@semoss/shared";
import { type ChatToolInfo, parseMcpTools } from "./tools/chat-tool-info";

/** What {@link useToolboxTools} returns. */
export interface UseToolboxToolsResult {
	/** `idle` until the toolbox is first opened. */
	status: "idle" | "loading" | "ready" | "error";
	/** The toolbox's tools, each with the reactor it runs. */
	tools: (ChatToolInfo & { reactor: string })[];
	/** Read the toolbox again. */
	reload: () => void;
}

/**
 * The tools in one toolbox, read the first time `isOpen` turns true and
 * again on {@link UseToolboxToolsResult.reload}, so a closed toolbox costs
 * nothing.
 *
 * @param toolbox - The toolbox.
 * @param isOpen - Whether its tools are being shown.
 * @return The tools and how the read went.
 */
export const useToolboxTools = (
	toolbox: Pick<MCPConfig, "id" | "type">,
	isOpen: boolean,
): UseToolboxToolsResult => {
	const { id, type } = toolbox;
	const [status, setStatus] =
		useState<UseToolboxToolsResult["status"]>("idle");
	const [tools, setTools] = useState<UseToolboxToolsResult["tools"]>([]);
	const [reloadCount, setReloadCount] = useState(0);
	// stays true once opened, so closing a toolbox does not throw away its tools
	const [isRequested, setIsRequested] = useState(isOpen);
	if (isOpen && !isRequested) {
		setIsRequested(true);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: reloadCount only asks for a new read
	useEffect(() => {
		if (!isRequested) return;
		let isCancelled = false;
		setStatus("loading");
		getMcpTools({ id: id, type: type })
			.then(parseMcpTools)
			.then(
				(next) => {
					if (!isCancelled) {
						setTools(next);
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
	}, [id, type, isRequested, reloadCount]);

	const reload = useCallback(() => {
		setReloadCount((count) => count + 1);
	}, []);

	return { status: status, tools: tools, reload: reload };
};
