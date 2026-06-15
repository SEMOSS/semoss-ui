import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Label, Textarea } from "@semoss/ui/next";
import type { ToolStore } from "@/stores";

interface ToolsServerViewProps {
	/** Connected tool */
	tool: ToolStore;
}

const formatJson = (raw: unknown): string => {
	if (raw === undefined || raw === null || raw === "") {
		return "";
	}
	if (typeof raw === "string") {
		try {
			return JSON.stringify(JSON.parse(raw), null, 2);
		} catch {
			return raw;
		}
	}
	try {
		return JSON.stringify(raw, null, 2);
	} catch {
		return String(raw);
	}
};

/**
 * Generic read-only view for server tools (e.g. provider-side web_search).
 * The model provider already executed the tool, so all we have to show is the
 * call's parameters and the raw result payload.
 */
export const ToolsServerView = observer(({ tool }: ToolsServerViewProps) => {
	const title = tool.json.title || tool.json.name;
	const description = tool.json.description;
	const parametersText = useMemo(
		() => formatJson(tool.parameters),
		[tool.parameters],
	);
	const responseText = useMemo(
		() => formatJson(tool.response),
		[tool.response],
	);
	const hasResponse = tool.status === "SUCCESS" && !!responseText;

	return (
		<div className="flex h-full w-full flex-col space-y-4 overflow-auto px-3 py-4 text-foreground">
			<div className="space-y-2 px-1">
				<h2 className="font-semibold text-2xl text-foreground">
					{title}
				</h2>
				{!!description && (
					<p className="text-muted-foreground">{description}</p>
				)}
			</div>

			<div className="flex flex-1 flex-col gap-4 overflow-y-auto px-1">
				<div className="flex flex-col space-y-2">
					<Label className="shrink-0 font-semibold">Parameters</Label>
					<Textarea
						readOnly
						className="w-full resize-none font-mono text-sm"
						rows={Math.min(
							12,
							Math.max(3, parametersText.split("\n").length),
						)}
						value={parametersText || "{}"}
					/>
				</div>

				{hasResponse && (
					<div className="flex flex-1 flex-col space-y-2">
						<Label className="shrink-0 font-semibold">Result</Label>
						<Textarea
							readOnly
							className="w-full flex-1 resize-none font-mono text-sm"
							value={responseText}
						/>
					</div>
				)}
			</div>
		</div>
	);
});
