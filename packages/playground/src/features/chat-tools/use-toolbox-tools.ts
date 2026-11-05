import { useCallback } from "react";
import { getMcpTools } from "@semoss/sdk";
import type { MCPConfig } from "@semoss/shared";
import { type ToolsRead, useToolsRead } from "./use-tools-read";

/**
 * The tools in one toolbox, read with `GetMCPTools` only when
 * {@link ToolsRead.load} is called, such as the first time the toolbox
 * opens, so a closed toolbox costs nothing. Another toolbox starts `idle`
 * again, with none of the last one's tools.
 *
 * @param toolbox - The toolbox.
 * @return The tools, how the read went, and a way to read them.
 */
export const useToolboxTools = (
	toolbox: Pick<MCPConfig, "id" | "type">,
): ToolsRead => {
	const { id, type } = toolbox;
	const read = useCallback(
		() => getMcpTools({ id: id, type: type }),
		[id, type],
	);
	return useToolsRead(`${type}:${id}`, read);
};
