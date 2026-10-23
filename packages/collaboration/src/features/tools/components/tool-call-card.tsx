import { useMemo, useRef } from "react";
import { getToolComponent, TOOL_COMPONENTS } from "../utils/tool-components";
import {
	GenericToolCallCard,
	type ToolCallCardProps,
} from "./generic-tool-call-card";
import { MemoryToolCard, parseMemoryResult } from "./memory-tool-card";

/** Playground-style tool card; a finished Remember or Forget shows what changed in memory instead. */
export function ToolCallCard(props: ToolCallCardProps) {
	const { tool } = props;
	// a call first seen before it finished ran while this page was open
	const sawRunning = useRef(tool.status !== "COMPLETED");
	const memoryResult = useMemo(
		() =>
			tool.status === "COMPLETED" &&
			getToolComponent(tool) === TOOL_COMPONENTS.memory
				? parseMemoryResult(tool.output)
				: null,
		[tool],
	);
	if (memoryResult)
		return (
			<MemoryToolCard
				tool={tool}
				result={memoryResult}
				isLive={sawRunning.current}
			/>
		);
	return <GenericToolCallCard {...props} />;
}
