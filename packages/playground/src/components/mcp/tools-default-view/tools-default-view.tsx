import { AlertCircle, Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { runMcpTool, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	toast,
} from "@semoss/ui/next";
import { ToolInspector } from "@/features/tool-inspector/tool-inspector";
import { decideAgentToolAction } from "@/stores/message/agent-harness";
import { ResponseMessageStore } from "@/stores/message/response-message.store";
import type { RoomStore } from "@/stores/room/room.store";
import type { ToolStore } from "@/stores/tool/tool.store";
import {
	getToolEngineId,
	isAskExecutionMode,
	isYesNoExecutionMode,
} from "@/utility/mcp-utils";
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
				title?: string;
				description?: string;
				inputSchema: {
					properties?: Record<string, FieldSchema>;
					required?: string[];
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
			tool.status === "ERROR" || tool.status === "CANCELLED";
		const metadataOriginalName = tool.json._meta?.SMSS_ORIGINAL_TOOL_NAME as
			| string
			| undefined;
		const foundTool =
			getMCP.status === "SUCCESS"
				? getMCP.data.tools.find(
						(candidate) =>
							candidate.name === metadataOriginalName ||
							candidate.name === tool.json.original_name ||
							(Boolean(tool.json.title) &&
								candidate.title === tool.json.title),
					)
				: undefined;
		const properties = foundTool?.inputSchema.properties ?? {};
		const required = foundTool?.inputSchema.required ?? [];
		const requiredFields = Object.entries(properties).filter(
			([fieldName]) => required.includes(fieldName),
		);
		const optionalFields = Object.entries(properties).filter(
			([fieldName]) => !required.includes(fieldName),
		);
		const toolExecution = tool?.json._meta?.SMSS_MCP_EXECUTION;
		const isAutoExecuting =
			!isAskExecutionMode(toolExecution) &&
			!isYesNoExecutionMode(toolExecution) &&
			tool.status !== "SUCCESS";

		// The call is over (succeeded or not), so the form is no longer actionable
		// and the arguments it ran with become part of the record to display.
		const hasExecuted = showResponse || toolFailed;

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

			// An agent-run tool paused on a decision must resume through the
			// AGENT_RUN_ACTION row, not the legacy room-write paths below —
			// see decideAgentToolAction.
			if (tool.pendingAction) {
				try {
					await decideAgentToolAction(tool, "submit", data);
				} catch (error) {
					toast.error((error as Error).toString());
				} finally {
					setIsSubmitting(false);
				}
				return;
			}

			let success = false;
			let output = "";
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
					output = await runMcpTool(
						{
							project: getToolEngineId(tool.json._meta) || app,
							roomId: room.roomId,
							name: tool.json.name,
							paramValues: data,
						},
						room.insightId,
					);
					success = true;
				}
			} catch (error) {
				output = (error as Error).toString();
				success = false;
			}
			const m = room.getMessage(message);
			// Only process the tool response if the tool is still open
			if (m && m instanceof ResponseMessageStore && tool.isOpen) {
				// The store owns the response and the executed parameters from
				// here on, so this view renders straight off the tool.
				room.processTool(
					m.id,
					tool.id,
					output,
					success ? "success" : "error",
					data,
				);
			}
			setIsSubmitting(false);
		};

		// Completed calls use the inspector's read-only payload view.
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

		return (
			<>
				<ToolInspector
					tool={tool}
					description={foundTool?.description}
					inputSchema={foundTool?.inputSchema}
					inputContent={
						!hasExecuted ? (
							<div className="h-full overflow-auto px-1 pb-2">
								{getMCP.status === "ERROR" ||
								(getMCP.status === "SUCCESS" && !foundTool) ? (
									<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
										<p className="font-semibold text-destructive text-lg">
											{t("form.schemaLoadFailed")}
										</p>
										<p className="text-muted-foreground text-sm">
											{t(
												"form.schemaLoadFailedDescription",
											)}
										</p>
									</div>
								) : getMCP.status === "SUCCESS" ? (
									<div className="flex flex-1 flex-col">
										<form
											className="flex-1 space-y-4"
											onSubmit={handleSubmit}
										>
											{Object.keys(properties).length ===
												0 &&
												!scriptForBrowserAutomation && (
													<p className="py-8 text-center text-muted-foreground text-sm">
														{t("form.noParameters")}
													</p>
												)}

											{renderFields(requiredFields, true)}

											{scriptForBrowserAutomation && (
												<div className="space-y-3 rounded-md border bg-muted/50 p-4">
													<h3 className="font-semibold text-base">
														{t(
															"playwright.details",
														)}
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
										</form>

										{!isAutoExecuting && (
											<div className="shrink-0 pt-4">
												<Button
													type="button"
													className="w-full"
													size="lg"
													onClick={handleSubmit}
													disabled={isSubmitting}
												>
													{isSubmitting ? (
														<>
															<Loader2 className="animate-spin" />
															{t(
																"form.executing",
															)}
														</>
													) : (
														t("form.execute")
													)}
												</Button>
											</div>
										)}
									</div>
								) : (
									<div className="flex flex-col items-center justify-center gap-2 py-12">
										<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
										<p className="text-muted-foreground text-sm">
											{t("form.schemaLoading")}
										</p>
									</div>
								)}
							</div>
						) : undefined
					}
				/>

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
									t("extension.retry")
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	},
);
