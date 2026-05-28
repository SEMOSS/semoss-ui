import { Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import { Button, Label, Textarea } from "@semoss/ui/next";
import { ResponseMessageStore, type RoomStore, type ToolStore } from "@/stores";
import { ToolField } from "./tool-field";

export interface ToolsDefaultViewProps {
	/** Room */
	room: RoomStore;

	/** Id of the app */
	app: string;

	/** Id of the message */
	message: string;

	/** Connected tool */
	tool: ToolStore;
}

interface FieldSchema {
	type?: string;
	enum?: string[];
	items?: unknown;
	minimum?: number;
	maximum?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	format?: string;
	default?: unknown;
	description?: string;
}

export const ToolsDefaultView = observer(
	({ room, app, message, tool }: ToolsDefaultViewProps) => {
		const { t } = useTranslation("tool");

		/*
		 * Library hooks
		 */
		const getMCP = usePixel<{
			tools: {
				name: string;
				inputSchema: {
					properties: Record<string, FieldSchema>;
					required: string[];
				};
			}[];
		}>(`GetMCPTools(project=["${app}"]);`, {
			data: {
				tools: [
					{
						name: "",
						inputSchema: {
							properties: {},
							required: [],
						},
					},
				],
			},
		});

		/*
		 * State
		 */
		const [data, setData] = useState<Record<string, unknown>>(
			tool.parameters || {},
		);
		const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
		const [showOptional, setShowOptional] = useState<boolean>(false);
		const [required, setRequired] = useState<string[]>([]);

		const [properties, setProperties] = useState<
			Record<string, FieldSchema>
		>({});
		const [response, setResponse] = useState<string | undefined>(
			tool.status === "SUCCESS" ? tool.response : undefined,
		);

		/*
		 * Constants
		 */
		// Separate required and optional fields
		const showResponse = tool.status === "SUCCESS";
		const toolFailed =
			tool.status === "ERROR" ||
			tool.status === "CANCELLED" ||
			tool.status === "PAUSED";
		const requiredFields = Object.entries(properties).filter(
			([fieldName]) => required.includes(fieldName),
		);
		const optionalFields = Object.entries(properties).filter(
			([fieldName]) => !required.includes(fieldName),
		);
		const title = tool?.json.title || "";
		const description = tool?.json.description || "";
		const isAutoExecuting =
			tool?.json._meta.SMSS_MCP_EXECUTION !== "ask" &&
			tool.status !== "SUCCESS";

		/*
		 * Functions
		 */
		const handleChange = (field: string, value: unknown) => {
			setData((prev) => ({ ...prev, [field]: value }));
		};

		// Tool Execution
		const handleSubmit = async () => {
			setIsSubmitting(true);
			let success = false;
			let output = "";
			try {
				const response = await room.runRoomPixel<[unknown]>(
					`RunMCPTool(project = [ "${app}" ], function=[ "${
						tool.name
					}" ], paramValues=[ ${JSON.stringify(data)} ]);`,
					false,
					false,
				);
				const rawOutput = response.pixelReturn[0].output;
				output =
					typeof rawOutput === "string"
						? rawOutput
						: JSON.stringify(rawOutput);
				success = true;
			} catch (error) {
				output = error instanceof Error ? error.message : String(error);
				success = false;
			}
			const m = room.getMessage(message);
			// Only process the tool response if the tool is still open
			if (m && m instanceof ResponseMessageStore && tool.isOpen) {
				room.processTool(
					m.id,
					tool.id,
					output,
					success ? "success" : "error",
					data,
				);
				setResponse(output);
			}
			setIsSubmitting(false);
		};

		// Render a group of fields
		const renderFields = (
			fields: [string, FieldSchema][],
			required: boolean,
		) =>
			fields.map(([fieldName, fieldSchema]) => (
				<ToolField
					key={fieldName}
					fieldName={fieldName}
					fieldSchema={fieldSchema}
					required={required && !showResponse && !isAutoExecuting}
					disabled={showResponse || !!isAutoExecuting}
					value={data[fieldName] ?? ""}
					onChange={(val) => handleChange(fieldName, val)}
				/>
			));

		/*
		 * Effects
		 */

		// Load tool schema
		useEffect(() => {
			if (getMCP.status === "SUCCESS" && tool?.json.original_name) {
				const foundTool = getMCP.data.tools.find(
					(t) => t.name === tool?.json.original_name,
				);
				if (foundTool) {
					setProperties(foundTool.inputSchema.properties);
					setRequired(foundTool.inputSchema.required);
				}
			}
		}, [getMCP, tool?.json.original_name]);

		return (
			// px-3 because applying padding on this div was clipping the shadow of the textareas
			// so we apply px-1 to the inner divs instead
			<div className="flex h-full w-full flex-col space-y-4 overflow-auto px-3 py-4 text-foreground">
				<div className="space-y-2 px-1">
					<h2 className="font-semibold text-2xl text-foreground">
						{title}
					</h2>
					{!!description && (
						<p className="text-muted-foreground">{description}</p>
					)}
				</div>

				<div className="flex-1 space-y-4 overflow-y-auto px-1">
					{showResponse && (
						<div className="flex flex-col space-y-2">
							<Label
								htmlFor="tool-response"
								className="shrink-0 font-semibold"
							>
								{t("form.result")}
							</Label>
							<Textarea
								readOnly
								className="w-full flex-1 resize-none"
								value={response}
							/>
						</div>
					)}
					{toolFailed && tool.response && (
						<div className="flex flex-col space-y-2">
							<Label
								htmlFor="tool-response"
								className="shrink-0 font-semibold text-destructive"
							>
								{t(
									`status.${
										tool.status === "ERROR"
											? "failed"
											: tool.status === "CANCELLED"
												? "cancelled"
												: "paused"
									}`,
								)}
							</Label>
							<Textarea
								readOnly
								className="w-full flex-1 resize-none border-destructive text-destructive"
								value={tool.response}
							/>
						</div>
					)}
					{getMCP.status === "ERROR" ? (
						<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
							<div className="text-destructive">
								<p className="font-semibold text-lg">
									{t("form.schemaLoadFailed")}
								</p>
								<p className="text-muted-foreground text-sm">
									{t("form.schemaLoadFailedDescription")}
								</p>
							</div>
						</div>
					) : getMCP.status === "SUCCESS" ? (
						showResponse ? (
							Object.keys(properties).length > 0 && (
								<>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											setShowOptional(!showOptional)
										}
										className="w-full"
									>
										{t(
											showOptional
												? "form.hideParameters"
												: "form.showParameters",
											{
												count: Object.keys(properties)
													.length,
											},
										)}
									</Button>

									{showOptional &&
										renderFields(
											Object.entries(properties),
											false,
										)}
								</>
							)
						) : (
							<form onSubmit={handleSubmit}>
								<div className="space-y-4">
									{Object.keys(properties).length === 0 &&
										!scriptForBrowserAutomation && (
											<p className="py-8 text-center text-muted-foreground text-sm">
												{t("form.noParameters")}
											</p>
										)}

									{/* Required fields */}
									{renderFields(requiredFields, true)}

									{/* Optional fields toggle */}
									{optionalFields.length > 0 && (
										<>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() =>
													setShowOptional(
														!showOptional,
													)
												}
												className="w-full"
											>
												{t(
													showOptional
														? "form.hideOptionalFields"
														: "form.showOptionalFields",
													{
														count: optionalFields.length,
													},
												)}
											</Button>

											{showOptional &&
												renderFields(
													optionalFields,
													false,
												)}
										</>
									)}
								</div>
							</form>
						)
					) : (
						<div className="flex flex-col items-center justify-center gap-2 py-12">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							<p className="text-muted-foreground text-sm">
								{t("form.schemaLoading")}
							</p>
						</div>
					)}
				</div>

				{!showResponse &&
					!isAutoExecuting &&
					!toolFailed &&
					getMCP.status === "SUCCESS" && (
						<div className="shrink-0 px-1">
							<Button
								type="button"
								className="w-full"
								size="lg"
								onClick={() => {
									handleSubmit();
								}}
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<>
										<Loader2 className="animate-spin" />
										{t("form.executing")}
									</>
								) : (
									t("form.execute")
								)}
							</Button>
						</div>
					)}
			</div>
		);
	},
);
