import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import type { FlexLayout } from "@semoss/shared";
import { Muted, Spinner, toast } from "@semoss/ui/next";
import { MCPJsonEditor } from "./mcp-json-editor";

interface EngineMcpEditorProps {
	/** Node */
	node: FlexLayout.TabNode;

	/** Engine */
	engine: string;
}

export const EngineMcpEditor: React.FC<EngineMcpEditorProps> = observer(
	({ node, engine }) => {
		const insight = useInsight();
		const config: {
			name: string;
			path: string;
		} = node.getConfig();

		const [data, setData] = useState<
			| React.ComponentProps<
					typeof MCPJsonEditor
			  >["dataMap"]["initialData"]
			| null
		>(null);
		const [isLoading, setIsLoading] = useState(false);

		const getFile = usePixel<string>(
			`GetEngineAssets(filePath=["${config.path}"], engine=["${engine}"]);`,
			{
				onSuccess: (fileContent) => {
					let data = {
						_meta: {},
						tools: [],
					};

					try {
						if (
							fileContent &&
							typeof fileContent === "string" &&
							fileContent.trim()
						) {
							data = JSON.parse(fileContent);
						} else {
							console.warn(
								"Empty, null, or non-string data received:",
								fileContent,
							);
						}
					} catch (e) {
						console.error("Failed to parse JSON:", e);
					}

					setData(data);
				},
				onError: () => {
					setData(null);
				},
			},
		);

		/**
		 * Save the file
		 */
		const saveFile = async (
			data: React.ComponentProps<
				typeof MCPJsonEditor
			>["dataMap"]["initialData"],
		) => {
			try {
				setIsLoading(true);

				await insight.actions.run(
					`SaveEngineAssets(engine=["${engine}"], filePath=["${config.path}"], content=["<encode>${JSON.stringify(
						data,
						null,
						2,
					)}</encode>"]);`,
				);

				toast.success("Successfully saved MCP tools");
			} catch (e) {
				toast.error("Error saving MCP tools");

				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<div className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden bg-background py-1">
				{(getFile.status === "LOADING" || isLoading) && (
					<div className="flex flex-1 items-center justify-center py-4">
						<Spinner />
					</div>
				)}
				{getFile.status === "ERROR" && (
					<div className="flex flex-1 items-center justify-center py-4">
						<Muted className="text-destructive">
							{getFile.error?.message || "Failed to load editor"}
						</Muted>
					</div>
				)}
				{getFile.status === "SUCCESS" && data && (
					<div className="flex h-full w-full flex-1 flex-col overflow-hidden">
						<MCPJsonEditor
							dataMap={{
								initialData: data,
								onSave: (data) => saveFile(data),
								path: config.path,
								name: config.name,
							}}
						/>
					</div>
				)}
			</div>
		);
	},
);
