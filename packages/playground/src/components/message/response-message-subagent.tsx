import { observer } from "mobx-react-lite";
import type { PixelMessageSubagentPart } from "@/types";

interface ResponseMessageSubagentProps {
	part: PixelMessageSubagentPart;
}

/**
 * WIP placeholder for a spawned subagent — status only, no alias/result/error,
 * no drill-in. See agent-harness.ts's item.kind === "subagent" handling.
 */
export const ResponseMessageSubagent: React.FC<ResponseMessageSubagentProps> =
	observer(({ part }) => {
		return (
			<div className="rounded-lg border-2 border-pink-500 bg-pink-200 px-3 py-2 text-pink-950 text-sm dark:bg-pink-950 dark:text-pink-100">
				Subagent {part.subagent.id} — {part.subagent.status}
			</div>
		);
	});
