import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ToolStore } from "@/stores/tool/tool.store";
import { ToolDataView } from "./tool-data-view";

interface ToolInfoProps {
	tool: ToolStore;
	description?: string;
	inputSchema?: unknown;
}

/** The supplied tool definition and call metadata, separate from its payloads. */
export const ToolInfo = observer(
	({ tool, description, inputSchema }: ToolInfoProps) => {
		const { t } = useTranslation("tool");
		const [metadataOpen, setMetadataOpen] = useState(false);
		const [schemaOpen, setSchemaOpen] = useState(false);
		const json = tool.json;
		const meta = json._meta;
		const rows = [
			[
				t("inspector.toolName"),
				meta?.SMSS_ORIGINAL_TOOL_NAME ||
					json.original_name ||
					json.name,
			],
			[t("inspector.callId"), tool.id],
			[
				t("inspector.source"),
				meta?.SMSS_ENGINE_NAME || meta?.SMSS_PROJECT_NAME,
			],
			[t("inspector.execution"), meta?.SMSS_MCP_EXECUTION],
		];

		return (
			<div className="h-full min-w-0 overflow-auto px-1 pb-2">
				<div className="space-y-4 text-sm">
					<div className="space-y-1">
						<h3 className="font-medium">{t("tabs.description")}</h3>
						<p className="whitespace-pre-wrap break-words text-muted-foreground">
							{description ||
								json.description ||
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
								setSchemaOpen(event.currentTarget.open)
							}
						>
							<summary className="cursor-pointer rounded-sm py-2 font-medium focus-visible:outline-ring">
								{t("inspector.inputSchema")}
							</summary>
							{schemaOpen && (
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
								setMetadataOpen(event.currentTarget.open)
							}
						>
							<summary className="cursor-pointer rounded-sm py-2 font-medium focus-visible:outline-ring">
								{t("inspector.metadata")}
							</summary>
							{metadataOpen && (
								<div className="h-72">
									<ToolDataView
										value={toJS(meta)}
										label={t("inspector.metadata")}
									/>
								</div>
							)}
						</details>
					)}
				</div>
			</div>
		);
	},
);
