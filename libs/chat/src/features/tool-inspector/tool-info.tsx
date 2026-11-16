import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ToolStore } from "../messages/tool.store";
import { useTool } from "../messages/use-tool";
import { useRoomSelector } from "../room/use-room-selector";
import { ToolDataView } from "./tool-data-view";

/** Props for {@link ToolInfo}. */
interface ToolInfoProps {
	/** The tool call to describe. */
	tool: ToolStore;
	/** The tool definition's description, ahead of the call's own. */
	description?: string;
	/** The tool definition's input schema; left out when unknown. */
	inputSchema?: unknown;
}

/** The supplied tool definition and call metadata, separate from its payloads. */
export const ToolInfo = ({ tool, description, inputSchema }: ToolInfoProps) => {
	const { t } = useTranslation("tool");
	// the schema and metadata viewers mount only once their section is opened
	const [isMetadataOpen, setIsMetadataOpen] = useState(false);
	const [isSchemaOpen, setIsSchemaOpen] = useState(false);
	// the call's json reads the room's options too; a decorated call's json
	// is a new object on every read, so select its values
	const { toolName, source, execution, toolDescription } = useRoomSelector(
		tool.room,
		() => {
			const json = tool.json;
			const meta = json._meta;
			return {
				toolName:
					meta?.SMSS_ORIGINAL_TOOL_NAME ||
					json.original_name ||
					json.name,
				source: meta?.SMSS_ENGINE_NAME || meta?.SMSS_PROJECT_NAME,
				execution: meta?.SMSS_MCP_EXECUTION,
				toolDescription: json.description,
			};
		},
	);
	const meta = useTool(tool, (current) => current.json._meta);
	const rows = [
		[t("inspector.toolName"), toolName],
		[t("inspector.callId"), tool.id],
		[t("inspector.source"), source],
		[t("inspector.execution"), execution],
	];

	return (
		<div className="h-full min-w-0 overflow-auto px-1 pb-2">
			<div className="space-y-4 text-sm">
				<div className="space-y-1">
					<h3 className="font-medium">{t("tabs.description")}</h3>
					<p className="whitespace-pre-wrap break-words text-muted-foreground">
						{description ||
							toolDescription ||
							t("form.noDescription")}
					</p>
				</div>
				<dl className="space-y-3">
					{rows
						.filter(([, value]) => !!value)
						.map(([label, value]) => (
							<div key={label} className="space-y-1">
								<dt className="text-muted-foreground">
									{label}
								</dt>
								<dd className="break-all font-mono text-xs">
									{value}
								</dd>
							</div>
						))}
				</dl>
				{inputSchema != null && (
					<details
						onToggle={(event) =>
							setIsSchemaOpen(event.currentTarget.open)
						}
					>
						<summary className="cursor-pointer rounded-sm py-2 font-medium focus-visible:outline-ring">
							{t("inspector.inputSchema")}
						</summary>
						{isSchemaOpen && (
							<div className="h-72">
								<ToolDataView
									value={inputSchema}
									label={t("inspector.inputSchema")}
								/>
							</div>
						)}
					</details>
				)}
				{meta && Object.keys(meta).length > 0 && (
					<details
						onToggle={(event) =>
							setIsMetadataOpen(event.currentTarget.open)
						}
					>
						<summary className="cursor-pointer rounded-sm py-2 font-medium focus-visible:outline-ring">
							{t("inspector.metadata")}
						</summary>
						{isMetadataOpen && (
							<div className="h-72">
								<ToolDataView
									value={meta}
									label={t("inspector.metadata")}
								/>
							</div>
						)}
					</details>
				)}
			</div>
		</div>
	);
};
