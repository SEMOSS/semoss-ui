import { Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useState } from "react";
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
	tool: ToolStore["json"];

	/** Response to the tool, if already completed */
	toolResponse?: string;

	/** Parameters that were executed */
	toolParameters?: Record<string, unknown>;
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

export const ToolsDefaultView: React.FC<ToolsDefaultViewProps> = observer(
	({ room, app, message, tool, toolResponse, toolParameters }) => {
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
		 * Constants
		 */
		const title = tool?.title || "";
		const description = tool?.description || "";

		/*
		 * State
		 */
		const [data, setData] = useState<Record<string, unknown>>(() => {
			return toolParameters || {};
		});
		const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
		const [showOptional, setShowOptional] = useState<boolean>(false);
		const [required, setRequired] = useState<string[]>([]);
		const [properties, setProperties] = useState<
			Record<string, FieldSchema>
		>({});
		const [response, setResponse] = useState<string>(toolResponse);

		/*
		 * Constants
		 */
		// Separate required and optional fields
		const hasBeenExecuted = response !== undefined;
		const requiredFields = Object.entries(properties).filter(
			([fieldName]) => required.includes(fieldName),
		);
		const optionalFields = Object.entries(properties).filter(
			([fieldName]) => !required.includes(fieldName),
		);

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
				output = error.toString();
				success = false;
			}
			const m = room.getMessage(message);
			if (!m || m instanceof ResponseMessageStore !== true) {
			} else {
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
					required={required && !hasBeenExecuted}
					disabled={hasBeenExecuted}
					value={data[fieldName] ?? ""}
					onChange={(val) => handleChange(fieldName, val)}
				/>
			));

		/*
		 * Effects
		 */

		// Load tool schema
		useEffect(() => {
			if (getMCP.status === "SUCCESS" && tool?.original_name) {
				const foundTool = getMCP.data.tools.find(
					(t) => t.name === tool.original_name,
				);
				if (foundTool) {
					setProperties(foundTool.inputSchema.properties);
					setRequired(foundTool.inputSchema.required);
				}
			}
		}, [getMCP, tool.original_name]);

		return (
			// px-3 because applying padding on this div was clipping the shadow of the textareas
			// so we apply px-1 to the inner divs instead
			<div className="flex h-full w-full flex-col space-y-4 overflow-auto px-3 py-4">
				<div className="space-y-2 px-1">
					<h2 className="font-semibold text-2xl">{title}</h2>
					{!!description && (
						<p className="text-muted-foreground">{description}</p>
					)}
				</div>

				<div className="flex-1 space-y-4 overflow-y-auto px-1">
					{hasBeenExecuted && (
						<div className="flex flex-col space-y-2">
							<Label
								htmlFor="tool-response"
								className="shrink-0 font-semibold"
							>
								Result
							</Label>
							<Textarea
								readOnly
								className="w-full flex-1 resize-none"
								value={response}
							/>
						</div>
					)}
					{getMCP.status === "ERROR" ? (
						<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
							<div className="text-destructive">
								<p className="font-semibold text-lg">
									Failed to load tool schema
								</p>
								<p className="text-muted-foreground text-sm">
									Unable to retrieve tool configuration.
									Please try again later.
								</p>
							</div>
						</div>
					) : getMCP.status === "SUCCESS" ? (
						hasBeenExecuted ? (
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
										{`${showOptional ? "Hide" : "Show"} Parameters (${Object.keys(properties).length})`}
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
												{`${showOptional ? "Hide" : "Show"} Optional Fields (${optionalFields.length})`}
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
								Loading tool schema...
							</p>
						</div>
					)}
				</div>

				{!hasBeenExecuted && getMCP.status === "SUCCESS" && (
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
									Executing...
								</>
							) : (
								"Execute Tool"
							)}
						</Button>
					</div>
				)}
			</div>
		);
	},
);
