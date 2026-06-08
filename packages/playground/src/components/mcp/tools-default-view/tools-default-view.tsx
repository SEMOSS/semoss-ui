import { AlertCircle, Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
		const [showExtensionDialog, setShowExtensionDialog] =
			useState<boolean>(false);
		const [extensionCheckRetrying, setExtensionCheckRetrying] =
			useState<boolean>(false);
		const extensionIsOpen = useRef<boolean>(false);

		const scriptForBrowserAutomation =
			typeof data.recordedFile === "string" ? data.recordedFile : "";

		useEffect(() => {
			const handleMessage = (event: MessageEvent) => {
				if (event.origin !== window.location.origin) {
					return;
				}

				if (event.data?.type === "SMSS_EXTENSION_OPENED") {
					extensionIsOpen.current = true;
				}

				if (event.data?.type === "SMSS_EXTENSION_CLOSED") {
					extensionIsOpen.current = false;
				}
			};

			window.addEventListener("message", handleMessage);

			return () => {
				window.removeEventListener("message", handleMessage);
			};
		}, []);

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

		/**
		 * Check if extension panel is open by actively pinging it
		 */
		const checkExtensionAvailable = async (): Promise<boolean> => {
			if (!scriptForBrowserAutomation) {
				return true;
			}

			// Active ping/pong validation with timeout
			return new Promise<boolean>((resolve) => {
				let timeoutId: ReturnType<typeof setTimeout> | null = null;
				let resolved = false;

				// Set up one-time listener for pong response
				const handlePong = (event: MessageEvent) => {
					if (event.origin !== window.location.origin) {
						return;
					}

					if (event.data?.type === "SMSS_EXTENSION_PONG") {
						if (!resolved) {
							resolved = true;
							if (timeoutId) clearTimeout(timeoutId);
							window.removeEventListener("message", handlePong);
							resolve(true);
						}
					}
				};

				// Add listener
				window.addEventListener("message", handlePong);

				// Set timeout for 2 seconds
				timeoutId = setTimeout(() => {
					if (!resolved) {
						resolved = true;
						window.removeEventListener("message", handlePong);
						resolve(false);
					}
				}, 2000);

				// Send ping
				window.postMessage(
					{
						type: "SMSS_EXTENSION_PING",
						timestamp: Date.now(),
					},
					"*",
				);
			});
		};

		// Tool Execution
		const handleSubmit = async () => {
			// Check if extension is available for Playwright scripts BEFORE setting isSubmitting
			if (scriptForBrowserAutomation) {
				const extensionAvailable = await checkExtensionAvailable();

				if (!extensionAvailable) {
					setShowExtensionDialog(true);
					return; // Stop execution until user opens extension
				}
			}

			setIsSubmitting(true);
			let success = false;
			let output = "";
			let shouldOpenFileExplorer = false;
			try {
				// Check if this is a Playwright script execution
				if (scriptForBrowserAutomation) {
					// Get session ID first
					const sessionIdResponse = await room.runRoomPixel<[string]>(
						"Session();",
						false,
						false,
					);
					const sessionId = sessionIdResponse.pixelReturn[0].output;

					// Fetch the complete Playwright script
					const scriptResponse = await room.runRoomPixel<[unknown]>(
						`GetAllSteps(project=["${app}"], sessionId=["${sessionId}"], fileName=["${scriptForBrowserAutomation}"]);`,
						false,
						false,
					);
					const scriptJson = scriptResponse.pixelReturn[0].output;

					// Log the fetched script to console

					// Send script to browser extension
					window.postMessage(
						{
							type: "SMSS_EXEC_PLAYWRIGHT_SCRIPT",
							script: {
								projectId: app,
								name: scriptForBrowserAutomation,
								autoExecute: false,
								scriptContent: scriptJson,
							},
						},
						"*",
					);

					output = `Successfully fetched Playwright script: ${scriptForBrowserAutomation}`;
					success = true;
				} else {
					// Normal MCP tool execution for non-Playwright tools
					const response = await room.runRoomPixel<[unknown]>(
						`RunMCPTool(project = [ "${app}" ], function=[ "${
							tool?.json.name
						}" ], paramValues=[ ${JSON.stringify(data)} ]);`,
						false,
						false,
					);
					const rawOutput = response.pixelReturn[0].output;
					output =
						typeof rawOutput === "string"
							? rawOutput
							: JSON.stringify(rawOutput);
					shouldOpenFileExplorer =
						room.shouldOpenFileExplorerForToolResult(
							tool?.json.name,
							rawOutput,
						);
					success = true;
				}
			} catch (error) {
				output = (error as Error).toString();
				success = false;
			}

			if (success && shouldOpenFileExplorer) {
				room.openFileExplorerSidebar();
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

									{/* Playwright Script Details */}
									{scriptForBrowserAutomation && (
										<div className="space-y-3 rounded-md border bg-muted/50 p-4">
											<h3 className="font-semibold text-base">
												{t("playwright.details")}
											</h3>
											<div className="space-y-2 text-sm">
												<div>
													<span className="font-medium">
														{t(
															"playwright.projectId",
														)}
														:
													</span>
													<span className="ms-2 text-muted-foreground">
														{app}
													</span>
												</div>
												<div>
													<span className="font-medium">
														{t(
															"playwright.recordedFile",
														)}
														:
													</span>
													<span className="ms-2 text-muted-foreground">
														{
															scriptForBrowserAutomation
														}
													</span>
												</div>
											</div>
										</div>
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

				{/* Extension Not Available Dialog */}
				<Dialog
					open={showExtensionDialog}
					onOpenChange={setShowExtensionDialog}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<AlertCircle className="h-5 w-5 text-warning" />
								{t("extension.required")}
							</DialogTitle>
							<DialogDescription>
								{t("extension.notResponding")}
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-3 py-4">
							<p className="font-medium text-sm">
								{t("extension.stepsTitle")}
							</p>
							{/* biome-ignore lint/nursery/useSortedClasses: order is correct */}
							<ol className="ms-2 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
								<li>{t("extension.step1")}</li>
								<li>{t("extension.step2")}</li>
								<li>{t("extension.step3")}</li>
								<li>{t("extension.step4")}</li>
							</ol>
						</div>
						<DialogFooter className="gap-2">
							<Button
								variant="outline"
								onClick={() => setShowExtensionDialog(false)}
							>
								{t("extension.cancel")}
							</Button>
							<Button
								onClick={async () => {
									setExtensionCheckRetrying(true);
									const available =
										await checkExtensionAvailable();
									setExtensionCheckRetrying(false);

									if (available) {
										setShowExtensionDialog(false);
										// Retry the execution
										handleSubmit();
									} else {
										// Still not available - user needs to open it
										console.warn(
											"[PLAYGROUND] ⚠️ Extension still not available after retry",
										);
									}
								}}
								disabled={extensionCheckRetrying}
							>
								{extensionCheckRetrying ? (
									<>
										<Loader2 className="me-2 h-4 w-4 animate-spin" />
										{t("extension.checking")}
									</>
								) : (
									t("extensionRetry")
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		);
	},
);
