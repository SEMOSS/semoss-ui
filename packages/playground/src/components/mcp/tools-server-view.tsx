import { Maximize2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Label,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
} from "@semoss/ui/next";
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
	const title = tool.displayName;
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

	const [tab, setTab] = useState<string>(hasResponse ? "output" : "inputs");
	const [showOutputDialog, setShowOutputDialog] = useState(false);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden text-foreground">
			<div className="shrink-0 px-4 pt-4 pb-2">
				<h2 className="font-semibold text-foreground text-xl">
					{title}
				</h2>
			</div>

			<Tabs
				value={tab}
				onValueChange={setTab}
				className="flex min-h-0 flex-1 flex-col"
			>
				<TabsList className="mx-4 mb-2 shrink-0 self-start">
					<TabsTrigger value="output">Output</TabsTrigger>
					<TabsTrigger value="inputs">Inputs</TabsTrigger>
					<TabsTrigger value="description">Description</TabsTrigger>
				</TabsList>

				<TabsContent
					value="output"
					className="mx-4 flex min-h-0 flex-1 flex-col space-y-2 overflow-auto"
				>
					{hasResponse ? (
						<>
							<div className="flex shrink-0 items-center justify-end">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-6 gap-1 px-2 text-muted-foreground text-xs"
									onClick={() => setShowOutputDialog(true)}
								>
									<Maximize2 className="size-3" />
									Expand
								</Button>
							</div>
							<Textarea
								readOnly
								className="w-full flex-1 resize-none font-mono text-sm"
								value={responseText}
							/>
						</>
					) : (
						<p className="py-8 text-center text-muted-foreground text-sm">
							No output yet.
						</p>
					)}
				</TabsContent>

				<TabsContent
					value="inputs"
					className="mx-4 flex min-h-0 flex-1 flex-col space-y-2 overflow-auto"
				>
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
				</TabsContent>

				<TabsContent value="description" className="mx-4 overflow-auto">
					{description ? (
						<p className="text-muted-foreground text-sm">
							{description}
						</p>
					) : (
						<p className="py-8 text-center text-muted-foreground text-sm">
							No description provided.
						</p>
					)}
				</TabsContent>
			</Tabs>

			<Dialog open={showOutputDialog} onOpenChange={setShowOutputDialog}>
				<DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
					<DialogHeader>
						<DialogTitle>{title} — Output</DialogTitle>
					</DialogHeader>
					<pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm">
						{responseText}
					</pre>
				</DialogContent>
			</Dialog>
		</div>
	);
});
