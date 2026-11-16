import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
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
import { decideAgentToolAction } from "../../messages/agent-harness";
import { ResponseMessageStore } from "../../messages/response-message.store";
import type { ToolStore } from "../../messages/tool.store";
import type { RoomStore } from "../../room/room.store";
import { useRoomSelector } from "../../room/use-room-selector";
import { ToolInspector } from "../../tool-inspector/tool-inspector";
import { getToolEngineId, isAskExecutionMode } from "../mcp-utils";
import { ToolField, type ToolFieldSchema } from "./tool-field";

/** Props for {@link ToolsDefaultView}. */
interface ToolsDefaultViewProps {
	/** The room the call belongs to. */
	room: RoomStore;

	/** Id of the app (project or engine) whose tools hold the call's schema. */
	app: string;

	/** Id of the message that made the call. */
	message: string;

	/** The tool call. */
	tool: ToolStore;
}

/**
 * The default view of an MCP tool call: a form built from the tool's input
 * schema (read with `GetMCPTools`) until the call has run, then the inspector's
 * read-only record. Executing runs the tool, decides an agent run's pending
 * action, or hands a recorded Playwright script to the browser extension.
 */
export const ToolsDefaultView = ({
	room,
	app,
	message,
	tool,
}: ToolsDefaultViewProps) => {
	const { t } = useTranslation("tool");
	// The call's json reads the room's options too, so select through the room
	const { status, metadataOriginalName, originalName, title, execution } =
		useRoomSelector(tool.room, () => {
			const json = tool.json;
			return {
				status: tool.status,
				metadataOriginalName: json._meta?.SMSS_ORIGINAL_TOOL_NAME as
					| string
					| undefined,
				originalName: json.original_name,
				title: json.title,
				execution: json._meta?.SMSS_MCP_EXECUTION,
			};
		});

	const getMCP = usePixel<{
		tools: {
			name: string;
			title?: string;
			description?: string;
			inputSchema: {
				properties?: Record<string, ToolFieldSchema>;
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

	const [data, setData] = useState<Record<string, unknown>>(
		tool.parameters || {},
	);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [isOptionalShown, setIsOptionalShown] = useState<boolean>(false);
	const [isExtensionDialogOpen, setIsExtensionDialogOpen] =
		useState<boolean>(false);
	const [isRetryingExtensionCheck, setIsRetryingExtensionCheck] =
		useState<boolean>(false);

	// A browser automation tool names its recorded Playwright script here
	const scriptForBrowserAutomation =
		typeof data.recordedFile === "string" ? data.recordedFile : "";

	const hasResponse = status === "SUCCESS";
	const hasFailed = status === "ERROR" || status === "CANCELLED";
	const foundTool =
		getMCP.status === "SUCCESS"
			? getMCP.data.tools.find(
					(candidate) =>
						candidate.name === metadataOriginalName ||
						candidate.name === originalName ||
						(Boolean(title) && candidate.title === title),
				)
			: undefined;
	const properties = foundTool?.inputSchema.properties ?? {};
	const required = foundTool?.inputSchema.required ?? [];
	const requiredFields = Object.entries(properties).filter(([fieldName]) =>
		required.includes(fieldName),
	);
	const optionalFields = Object.entries(properties).filter(
		([fieldName]) => !required.includes(fieldName),
	);
	const isAutoExecuting =
		!isAskExecutionMode(execution) && status !== "SUCCESS";

	// The call is over (succeeded or not), so the form is no longer actionable
	// and the arguments it ran with become part of the record to display.
	const hasExecuted = hasResponse || hasFailed;

	/**
	 * Sets one parameter in the form's draft.
	 *
	 * @param field - The parameter's name.
	 * @param value - Its next value.
	 */
	const handleChange = (field: string, value: unknown): void => {
		setData((prev) => ({ ...prev, [field]: value }));
	};

	/**
	 * Checks that the browser extension's panel is open by pinging it, since a
	 * Playwright script can only run there.
	 *
	 * @returns Whether it answered within two seconds; true when the call has no script.
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

	/** Runs the call with the form's parameters and records its result on the room. */
	const handleSubmit = async (): Promise<void> => {
		// Check if extension is available for Playwright scripts BEFORE setting isSubmitting
		if (scriptForBrowserAutomation) {
			const extensionAvailable = await checkExtensionAvailable();

			if (!extensionAvailable) {
				setIsExtensionDialogOpen(true);
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
		const responseMessage = room.getMessage(message);
		// Only process the tool response if the tool is still open
		if (responseMessage instanceof ResponseMessageStore && tool.isOpen) {
			// The store owns the response and the executed parameters from
			// here on, so this view renders straight off the tool.
			room.processTool(
				responseMessage.id,
				tool.id,
				output,
				success ? "success" : "error",
				data,
			);
		}
		setIsSubmitting(false);
	};

	/**
	 * Draws a list of the form's fields. Completed calls use the inspector's
	 * read-only payload view instead.
	 *
	 * @param fields - The parameters to draw, each with its schema.
	 * @param required - Whether these are the tool's required parameters.
	 * @returns One `ToolField` per parameter.
	 */
	const renderFields = (
		fields: [string, ToolFieldSchema][],
		required: boolean,
	) =>
		fields.map(([fieldName, fieldSchema]) => (
			<ToolField
				key={fieldName}
				fieldName={fieldName}
				fieldSchema={fieldSchema}
				required={required && !hasResponse && !isAutoExecuting}
				disabled={hasResponse || !!isAutoExecuting}
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
										{t("form.schemaLoadFailedDescription")}
									</p>
								</div>
							) : getMCP.status === "SUCCESS" ? (
								<div className="flex flex-1 flex-col">
									<form
										className="flex-1 space-y-4"
										onSubmit={handleSubmit}
									>
										{Object.keys(properties).length === 0 &&
											!scriptForBrowserAutomation && (
												<p className="py-8 text-center text-muted-foreground text-sm">
													{t("form.noParameters")}
												</p>
											)}

										{renderFields(requiredFields, true)}

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

										{optionalFields.length > 0 && (
											<>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														setIsOptionalShown(
															!isOptionalShown,
														)
													}
													className="w-full"
												>
													{t(
														isOptionalShown
															? "form.hideOptionalFields"
															: "form.showOptionalFields",
														{
															count: optionalFields.length,
														},
													)}
												</Button>
												{isOptionalShown &&
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
														{t("form.executing")}
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
				open={isExtensionDialogOpen}
				onOpenChange={setIsExtensionDialogOpen}
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
							onClick={() => setIsExtensionDialogOpen(false)}
						>
							{t("extension.cancel")}
						</Button>
						<Button
							onClick={async () => {
								setIsRetryingExtensionCheck(true);
								const available =
									await checkExtensionAvailable();
								setIsRetryingExtensionCheck(false);

								if (available) {
									setIsExtensionDialogOpen(false);
									// Retry the execution
									handleSubmit();
								} else {
									// Still not available - user needs to open it
									console.warn(
										"[PLAYGROUND] ⚠️ Extension still not available after retry",
									);
								}
							}}
							disabled={isRetryingExtensionCheck}
						>
							{isRetryingExtensionCheck ? (
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
};
