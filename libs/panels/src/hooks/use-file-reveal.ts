import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import type { FileExplorerApi } from "@semoss/shared";

export interface FileRevealRequest {
	path: string;
	requestId: string;
}

/** Resolve the exact row in its own scope, then navigate and select without opening it. */
export function useFileReveal(
	explorer: FileExplorerApi,
	request: FileRevealRequest | undefined,
	insightId: string,
): string {
	const [error, setError] = useState("");
	const path = request?.path;
	const requestId = request?.requestId;
	useEffect(() => {
		if (!path || !requestId || !insightId) return;
		let active = true;
		setError("");
		const normalized = path.replace(/^\/+/, "");
		const parent = normalized.includes("/")
			? normalized.slice(0, normalized.lastIndexOf("/"))
			: "/";
		void (async () => {
			try {
				const result = await runPixel<[unknown]>(
					explorer.adapter.browse(parent),
					insightId,
				);
				if (!active) return;
				if (result.errors.length)
					throw new Error(result.errors.join("\n"));
				const item = explorer.adapter
					.mapEntries(result.pixelReturn[0]?.output, parent)
					.find(
						(candidate) =>
							candidate.path.replace(/^\/+/, "") === normalized,
					);
				if (!item)
					throw new Error(
						"This file is no longer available in this folder.",
					);
				explorer.commands.navigateTo(parent);
				explorer.commands.refresh();
				explorer.commands.clearSelection();
				explorer.tree.toggleBulkSelection(item);
			} catch (cause) {
				if (active)
					setError(
						cause instanceof Error
							? cause.message
							: "Could not locate this file.",
					);
			}
		})();
		return () => {
			active = false;
		};
	}, [explorer, path, requestId, insightId]);
	return error;
}
