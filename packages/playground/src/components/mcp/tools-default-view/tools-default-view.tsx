import { Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Label,
	Textarea,
} from "@semoss/ui/next";
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
	executedParameters?: Record<string, unknown>;
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
	({ room, app, message, tool, toolResponse, executedParameters }) => {
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
		const hasBeenExecuted = toolResponse !== undefined;

		/*
		 * State
		 */
		const [data, setData] = useState<Record<string, unknown>>(() => {
			return hasBeenExecuted ? executedParameters : tool?.parameters;
		});
		const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
		const [showOptional, setShowOptional] = useState<boolean>(false);
		const [required, setRequired] = useState<string[]>([]);
		const [properties, setProperties] = useState<
			Record<string, FieldSchema>
		>({});

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
				const response = await room.runRoomPixel<[string]>(
					`RunMCPTool(project = [ "${app}" ], function=[ "${
						tool.name
					}" ], paramValues=[ ${JSON.stringify(data)} ]);`,
					false,
					false,
				);
				output = response.pixelReturn[0].output;
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
					tool.name,
					output,
					success ? "success" : "error",
					data,
				);
			}
			setIsSubmitting(false);
		};

		const renderField = (fieldName: string, fieldSchema: FieldSchema) => {
			const isRequired = required.includes(fieldName) && !hasBeenExecuted;
			const value = data[fieldName] ?? "";

			return (
				<ToolField
					fieldName={fieldName}
					fieldSchema={fieldSchema}
					required={isRequired}
					disabled={hasBeenExecuted}
					value={value}
					onChange={(val) => handleChange(fieldName, val)}
				/>
			);
		};

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

		/*
		 * Constants
		 */

		// Separate required and optional fields
		const requiredFields = Object.entries(properties).filter(
			([fieldName]) => required.includes(fieldName),
		);
		const optionalFields = Object.entries(properties).filter(
			([fieldName]) => !required.includes(fieldName),
		);

		return (
			<div className="flex h-full w-full flex-col items-center justify-center overflow-auto p-4">
				<Card className="h-full w-full">
					<CardHeader>
						<CardTitle className="font-semibold text-2xl">
							{title}
						</CardTitle>
						{!!description && (
							<CardDescription className="mt-2">
								{description}
							</CardDescription>
						)}
					</CardHeader>
					<CardContent className="max-h-[60vh] overflow-y-auto">
						{toolResponse ? (
							<div className="space-y-4">
								<div className="flex h-full flex-col space-y-2">
									<Label
										htmlFor="tool-response"
										className="shrink-0 font-semibold"
									>
										Result
									</Label>
									<Textarea
										readOnly
										className="w-full resize-none"
										value={toolResponse}
									/>
								</div>
								{Object.keys(properties).length > 0 && ( // todo: this logic
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
											Object.entries(properties).map(
												([fieldName, fieldSchema]) =>
													renderField(
														fieldName,
														fieldSchema,
													),
											)}
									</>
								)}
							</div>
						) : (
							<form onSubmit={handleSubmit}>
								<div className="space-y-4">
									{/* Required fields */}
									{requiredFields.map(
										([fieldName, fieldSchema]) =>
											renderField(fieldName, fieldSchema),
									)}

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
												optionalFields.map(
													([
														fieldName,
														fieldSchema,
													]) =>
														renderField(
															fieldName,
															fieldSchema,
														),
												)}
										</>
									)}
								</div>
							</form>
						)}
					</CardContent>
					{!toolResponse && (
						<CardFooter>
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
						</CardFooter>
					)}
				</Card>
			</div>
		);
	},
);
