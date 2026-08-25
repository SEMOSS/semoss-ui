import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Label, Tabs, TabsContent, Textarea } from "@semoss/ui/next";
import type { ToolStore } from "@/stores";
import {
	TOOL_CARD_TAB_CONTENT_CLASS,
	ToolCardHeader,
	ToolCardTabsList,
	ToolDescriptionTabContent,
	ToolOutputDialog,
	ToolOutputText,
	ToolTabScrollArea,
} from "./tool-card-tabs";

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
	const { t } = useTranslation("tool");
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

	// The result can arrive after this view has already mounted (the
	// provider executes the tool server-side), so switch to the output tab
	// once it does rather than leaving the user stuck on Inputs.
	useEffect(() => {
		if (hasResponse) {
			setTab("output");
		}
	}, [hasResponse]);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden text-foreground">
			<ToolCardHeader title={title} />

			<Tabs
				value={tab}
				onValueChange={setTab}
				className="flex min-h-0 flex-1 flex-col"
			>
				<ToolCardTabsList />

				<ToolDescriptionTabContent description={description} />

				<TabsContent
					value="inputs"
					className={TOOL_CARD_TAB_CONTENT_CLASS}
				>
					<ToolTabScrollArea>
						<Label className="shrink-0 font-semibold">
							{t("form.parameters")}
						</Label>
						<Textarea
							readOnly
							className="w-full resize-none font-mono text-sm"
							rows={Math.min(
								12,
								Math.max(3, parametersText.split("\n").length),
							)}
							value={parametersText || "{}"}
						/>
					</ToolTabScrollArea>
				</TabsContent>

				<TabsContent
					value="output"
					className={TOOL_CARD_TAB_CONTENT_CLASS}
				>
					<ToolTabScrollArea>
						{hasResponse ? (
							<ToolOutputText
								text={responseText}
								onExpand={() => setShowOutputDialog(true)}
							/>
						) : (
							<p className="py-8 text-center text-muted-foreground text-sm">
								{t("form.noOutput")}
							</p>
						)}
					</ToolTabScrollArea>
				</TabsContent>
			</Tabs>

			<ToolOutputDialog
				title={title}
				text={responseText}
				open={showOutputDialog}
				onOpenChange={setShowOutputDialog}
			/>
		</div>
	);
});
