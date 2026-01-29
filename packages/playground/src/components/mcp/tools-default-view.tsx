import { Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Checkbox,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import { ResponseMessageStore, type RoomStore } from "@/stores";
import type { MCPTool } from "@/types";

//TODO: Move to a separate file
interface JSONEditorProps {
	value: unknown;
	onChange: (v: unknown) => void;
}

const JSONEditor = ({ value, onChange }: JSONEditorProps) => {
	const [text, setText] = useState(() => {
		try {
			return JSON.stringify(value ?? {}, null, 2);
		} catch (_) {
			return "";
		}
	});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		try {
			setText(JSON.stringify(value ?? {}, null, 2));
			setError(null);
		} catch (_) {
			setText("");
		}
	}, [value]);

	return (
		<div className="space-y-2">
			<Textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				rows={8}
				className="w-full font-mono text-sm"
			/>
			{error && <p className="text-destructive text-sm">{error}</p>}
			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						try {
							const parsed = text.trim() ? JSON.parse(text) : {};
							onChange(parsed);
							setError(null);
						} catch (err) {
							setError((err as Error).message);
						}
					}}
				>
					Apply
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => {
						try {
							setText(JSON.stringify(value ?? {}, null, 2));
							setError(null);
						} catch (_) {
							setText("");
						}
					}}
				>
					Reset
				</Button>
			</div>
		</div>
	);
};

interface ToolsDefaultViewProps {
	/** Room */
	room: RoomStore;

	/** Id of the app */
	app: string;

	/** Id of the message */
	message: string;

	/** Connected tool */
	tool: {
		id: string;
		name: string;
		parameters: Record<string, unknown>;
	};

	/** Response to the tool, if already completed */
	toolResponse?: string;

	/** MCP */
	mcp: MCPTool;
}

export const ToolsDefaultView: React.FC<ToolsDefaultViewProps> = observer(
	({ room, app, message, tool, mcp, toolResponse }) => {
		const properties = mcp?.inputSchema?.properties || {};
		const required = mcp?.inputSchema?.required || [];
		const name = mcp?.name || "";
		const description = mcp?.description || "";
		const [data, setData] = useState<Record<string, unknown>>(() => {
			return tool?.parameters;
		});
		const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
		const [showOptional, setShowOptional] = useState<boolean>(false);

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
						mcp.name
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

		const capitalizeWords = (str: string) =>
			str
				.split(/[_\s]+/) // Split by underscores or spaces
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" "); // Join with spaces for better readability

		const renderField = (
			fieldName: string,
			fieldSchema: {
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
			},
		) => {
			const isRequired = required.includes(fieldName);
			const value = data[fieldName] ?? "";
			const displayName = capitalizeWords(fieldName);

			switch (fieldSchema.type) {
				case "string":
					if (fieldSchema.enum) {
						return (
							<div key={fieldName} className="space-y-1">
								<div className="mb-2 flex items-center gap-2">
									<Label
										htmlFor={fieldName}
										className="font-semibold"
									>
										{displayName}
										{isRequired && (
											<span className="text-destructive">
												{" "}
												*
											</span>
										)}
									</Label>
									<Badge
										variant="outline"
										className="text-xs"
									>
										{fieldSchema.type}
									</Badge>
								</div>
								<Select
									value={value as string}
									onValueChange={(val) =>
										handleChange(fieldName, val)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={`Select ${displayName}`}
										/>
									</SelectTrigger>
									<SelectContent>
										{fieldSchema.enum.map(
											(option: string) => (
												<SelectItem
													key={option}
													value={option}
												>
													{capitalizeWords(option)}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
								{fieldSchema.description && (
									<p className="text-muted-foreground text-sm">
										{fieldSchema.description}
									</p>
								)}
							</div>
						);
					}
					if (fieldSchema.maxLength && fieldSchema.maxLength > 100) {
						return (
							<div key={fieldName} className="space-y-1">
								<div className="mb-2 flex items-center gap-2">
									<Label
										htmlFor={fieldName}
										className="font-semibold"
									>
										{displayName}
										{isRequired && (
											<span className="text-destructive">
												{" "}
												*
											</span>
										)}
									</Label>
									<Badge
										variant="outline"
										className="text-xs"
									>
										{fieldSchema.type}
									</Badge>
								</div>
								<Textarea
									id={fieldName}
									value={value as string}
									onChange={(e) =>
										handleChange(fieldName, e.target.value)
									}
									placeholder={`Enter ${displayName}`}
									rows={4}
									className="w-full"
								/>
								{fieldSchema.description && (
									<p className="text-muted-foreground text-sm">
										{fieldSchema.description}
									</p>
								)}
							</div>
						);
					}
					return (
						<div key={fieldName} className="space-y-1">
							<div className="mb-2 flex items-center gap-2">
								<Label
									htmlFor={fieldName}
									className="font-semibold"
								>
									{displayName}
									{isRequired && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</Label>
								<Badge variant="outline" className="text-xs">
									{fieldSchema.type}
								</Badge>
							</div>
							<Input
								id={fieldName}
								value={value as string}
								onChange={(e) =>
									handleChange(fieldName, e.target.value)
								}
								placeholder={`Enter ${displayName}`}
								className="w-full"
							/>
							{fieldSchema.description && (
								<p className="text-muted-foreground text-sm">
									{fieldSchema.description}
								</p>
							)}
						</div>
					);

				case "number":
				case "integer":
					return (
						<div key={fieldName} className="space-y-1">
							<div className="mb-2 flex items-center gap-2">
								<Label
									htmlFor={fieldName}
									className="font-semibold"
								>
									{displayName}
									{isRequired && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</Label>
								<Badge variant="outline" className="text-xs">
									{fieldSchema.type}
								</Badge>
							</div>
							<Input
								id={fieldName}
								type="number"
								value={value as number}
								onChange={(e) =>
									handleChange(
										fieldName,
										Number.parseFloat(e.target.value),
									)
								}
								placeholder={`Enter ${displayName}`}
								min={fieldSchema.minimum}
								max={fieldSchema.maximum}
								className="w-full"
							/>
							{fieldSchema.description && (
								<p className="text-muted-foreground text-sm">
									{fieldSchema.description}
								</p>
							)}
						</div>
					);

				case "boolean":
					return (
						<div
							key={fieldName}
							className="flex items-center space-x-2"
						>
							<Checkbox
								id={fieldName}
								checked={(value as boolean) || false}
								onCheckedChange={(checked) =>
									handleChange(fieldName, checked)
								}
							/>
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Label
										htmlFor={fieldName}
										className="font-semibold"
									>
										{displayName}
										{isRequired && (
											<span className="text-destructive">
												{" "}
												*
											</span>
										)}
									</Label>
									<Badge
										variant="outline"
										className="text-xs"
									>
										{fieldSchema.type}
									</Badge>
								</div>
								{fieldSchema.description && (
									<p className="text-muted-foreground text-sm">
										{fieldSchema.description}
									</p>
								)}
							</div>
						</div>
					);

				case "array":
					return (
						<div key={fieldName} className="space-y-1">
							<div className="mb-2 flex items-center gap-2">
								<Label
									htmlFor={fieldName}
									className="font-semibold"
								>
									{displayName}
									{isRequired && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</Label>
								<Badge variant="outline" className="text-xs">
									{fieldSchema.type}
								</Badge>
							</div>
							<Textarea
								id={fieldName}
								value={
									(Array.isArray(value)
										? value.join(", ")
										: value) as string
								}
								onChange={(e) =>
									handleChange(
										fieldName,
										e.target.value
											.split(",")
											.map((s) => s.trim()),
									)
								}
								placeholder="Enter comma-separated values"
								rows={2}
								className="w-full"
							/>
							{fieldSchema.description && (
								<p className="text-muted-foreground text-sm">
									{fieldSchema.description}
								</p>
							)}
						</div>
					);

				case "object": {
					// treat object as arbitrary JSON (may be nested) — use JSONEditor for full flexibility
					const obj =
						value && typeof value === "object"
							? (value as Record<string, unknown>)
							: {};
					return (
						<div key={fieldName} className="space-y-2">
							<div className="mb-2 flex items-center gap-2">
								<Label
									htmlFor={fieldName}
									className="font-semibold"
								>
									{displayName}
									{isRequired && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</Label>
								<Badge variant="outline" className="text-xs">
									object
								</Badge>
							</div>
							<JSONEditor
								value={obj}
								onChange={(v) => handleChange(fieldName, v)}
							/>
							{fieldSchema.description && (
								<p className="text-muted-foreground text-sm">
									{fieldSchema.description}
								</p>
							)}
						</div>
					);
				}

				default:
					return (
						<div key={fieldName} className="space-y-1">
							<div className="mb-2 flex items-center gap-2">
								<Label
									htmlFor={fieldName}
									className="font-semibold"
								>
									{displayName}
									{isRequired && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</Label>
								<Badge variant="outline" className="text-xs">
									{fieldSchema.type || "unknown"}
								</Badge>
							</div>
							<Input
								id={fieldName}
								value={value as string}
								onChange={(e) =>
									handleChange(fieldName, e.target.value)
								}
								placeholder={`Enter ${displayName}`}
								className="w-full"
							/>
						</div>
					);
			}
		};

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
							{capitalizeWords(name)}
						</CardTitle>
						{!!description && (
							<CardDescription className="mt-2">
								{description}
							</CardDescription>
						)}
					</CardHeader>
					<CardContent className="max-h-[60vh] overflow-y-auto">
						{toolResponse ? (
							<div className="flex h-full flex-col space-y-1">
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
						) : (
							<form onSubmit={handleSubmit} className="space-y-6">
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
												{showOptional ? "Hide" : "Show"}{" "}
												Optional Fields (
												{optionalFields.length})
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
