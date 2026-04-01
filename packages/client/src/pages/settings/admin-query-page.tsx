import { ArrowRight, Copy } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { Box, styled, useNotification } from "@semoss/ui";
import {
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Button as ShadcnButton,
	Select as ShadcnSelect,
	Textarea as ShadcnTextarea,
} from "@semoss/ui/next";
import { QueryResultsPanel } from "@/components/database";
import { useRootStore, useSettings } from "@/hooks";
import {
	hasTabularData,
	isErrorResponse,
	type QueryResult,
} from "@/hooks/useDatabaseQueryExecution";

const StyledContainer = styled("div")(() => ({
	display: "flex",
	width: "100%",
	gap: "24px",
}));

const StyledLeft = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	width: "100%",
}));

const StyledRight = styled("div")(() => ({
	width: "100%",
	marginTop: "20px",
}));
const Styledform = styled("div")(() => ({
	width: "100%",
}));
const StyledStack = styled("div")(() => ({
	width: "100%",
	gap: "20px",
	flexDirection: "column",
	display: "flex",
	marginBottom: "20px",
}));

const Field = styled(Box)(() => ({
	display: "flex",
	flexDirection: "column",
	width: "100%",
	gap: "8px",
}));

const Label = styled("label")(({ theme }) => ({
	fontSize: "0.875rem",
	lineHeight: 1.4,
	color: theme.palette.text.secondary,
}));

const DATABASE_OPTIONS = [
	{ label: "Audit Logs", value: "AuditLogs" },
	{ label: "Local Master Database", value: "LocalMasterDatabase" },
	{
		label: "Model Inference Logs Database",
		value: "ModelInferenceLogsDatabase",
	},
	{ label: "Scheduler", value: "scheduler" },
	{ label: "Security", value: "security" },
	{ label: "Themes", value: "themes" },
	{ label: "User Tracking Database", value: "UserTrackingDatabase" },
];

interface TypeDbQuery {
	SELECTED_DATABASE: string;
	QUERY: string;
}

export const AdminQueryPage = () => {
	const { monolithStore } = useRootStore();
	const { configStore } = useRootStore();
	const { adminMode } = useSettings();
	const dbSelectId = useId();
	const queryTextareaId = useId();
	const notification = useNotification();
	const [previewData, setPreviewData] = useState<QueryResult | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [queryEditorHeight, setQueryEditorHeight] = useState(160);
	const resizeStateRef = useRef<{
		startY: number;
		startHeight: number;
	} | null>(null);
	const { control, watch, handleSubmit } = useForm<{
		SELECTED_DATABASE: string;
		QUERY: string;
	}>({
		defaultValues: {
			SELECTED_DATABASE: "",
			QUERY: "",
		},
	});

	const handleQueryResizeStart = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			resizeStateRef.current = {
				startY: event.clientY,
				startHeight: queryEditorHeight,
			};
		},
		[queryEditorHeight],
	);

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			const resizeState = resizeStateRef.current;
			if (!resizeState) {
				return;
			}

			const deltaY = event.clientY - resizeState.startY;
			const nextHeight = resizeState.startHeight + deltaY;
			const constrainedHeight = Math.max(140, Math.min(560, nextHeight));
			setQueryEditorHeight(constrainedHeight);
		};

		const handleMouseUp = () => {
			resizeStateRef.current = null;
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, []);

	const copyQuery = async (value: string) => {
		if (!value?.trim()) {
			return;
		}

		try {
			await navigator.clipboard.writeText(value);
			notification.add({
				color: "success",
				message: "Query copied",
			});
		} catch (_error) {
			notification.add({
				color: "error",
				message: "Failed to copy query",
			});
		}
	};

	const query = watch("QUERY");
	const selectedDatabase = watch("SELECTED_DATABASE");

	const disableButton = !selectedDatabase || !query?.trim();

	if (!adminMode) {
		return <Navigate to={"/settings"} />;
	}

	const databaseOptions = configStore.config.notificationEnabled
		? [
				...DATABASE_OPTIONS,
				{ label: "Notification", value: "Notification" },
			]
		: DATABASE_OPTIONS;

	/**
	 * @name submitQuery
	 * @desc make runQuery API call based on submitted fields
	 */
	const mapResponseToQueryResult = (
		response: unknown,
		queryText: string,
	): QueryResult => {
		const firstResult =
			typeof response === "object" &&
			response !== null &&
			"pixelReturn" in response &&
			Array.isArray((response as { pixelReturn?: unknown[] }).pixelReturn)
				? (response as { pixelReturn: unknown[] }).pixelReturn[0]
				: null;

		if (firstResult && typeof firstResult === "object") {
			const normalized: QueryResult = {
				...(firstResult as Omit<QueryResult, "queryType">),
				queryType: "OTHER",
				queryText,
			};

			normalized.queryType = hasTabularData(normalized)
				? "SELECT"
				: "OTHER";
			return normalized;
		}

		const fallback: QueryResult = {
			output: response,
			timeToRun: 0,
			queryType: "OTHER",
			queryText,
		};

		fallback.queryType = hasTabularData(fallback) ? "SELECT" : "OTHER";
		return fallback;
	};

	const submitQuery = handleSubmit(async (data: TypeDbQuery) => {
		const queryToRun = data.QUERY ?? "";
		const pixelString = `AdminSqlQuery(database=["${data.SELECTED_DATABASE}"], query=["<encode>${queryToRun.replaceAll("`", "")}</encode>"], commit=[true]);`;

		setPreviewLoading(true);
		try {
			const response = await monolithStore.runQuery(pixelString);
			const result = mapResponseToQueryResult(response, queryToRun);
			setPreviewData(result);

			if (isErrorResponse(result)) {
				notification.add({
					color: "error",
					message:
						typeof result.output === "string"
							? result.output
							: JSON.stringify(result.output),
				});
				return;
			}

			notification.add({
				color: "success",
				message: "Successfully submitted query",
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			setPreviewData({
				error: true,
				output: `Error: ${message}`,
				operationType: ["ERROR"],
				queryType: "OTHER",
				queryText: queryToRun,
			});
			notification.add({
				color: "error",
				message,
			});
		} finally {
			setPreviewLoading(false);
		}
	});

	return (
		<StyledContainer>
			<StyledLeft>
				<Styledform>
					<StyledStack>
						<Controller
							name="SELECTED_DATABASE"
							control={control}
							render={({ field }) => (
								<Field>
									<Label htmlFor={dbSelectId}>Database</Label>
									<ShadcnSelect
										value={field.value ?? ""}
										onValueChange={field.onChange}
									>
										<SelectTrigger
											id={dbSelectId}
											className="w-full"
										>
											<SelectValue placeholder="Select database" />
										</SelectTrigger>
										<SelectContent>
											{databaseOptions?.map(
												(option, i) => (
													<SelectItem
														value={option.value}
														key={option.value}
														data-testid={`adminQueryPage-db-option-${i}`}
													>
														{option.label}
													</SelectItem>
												),
											)}
										</SelectContent>
									</ShadcnSelect>
								</Field>
							)}
						/>
					</StyledStack>

					<Controller
						name={"QUERY"}
						control={control}
						render={({ field }) => {
							return (
								<Field>
									<div className="mb-1 flex items-center justify-between">
										<Label htmlFor={queryTextareaId}>
											Enter Query
										</Label>
									</div>
									<div className="group/query-editor relative">
										<ShadcnTextarea
											id={queryTextareaId}
											value={field.value ?? ""}
											onChange={(e) =>
												field.onChange(e.target.value)
											}
											rows={8}
											placeholder="SELECT * FROM engine"
											style={{
												height: `${queryEditorHeight}px`,
											}}
											className="!text-sm resize-none overflow-y-auto pb-4 [-ms-overflow-style:none] [field-sizing:fixed] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
										/>
										<div className="pointer-events-none absolute top-2 right-2 z-10 opacity-0 transition-opacity group-focus-within/query-editor:pointer-events-auto group-focus-within/query-editor:opacity-100 group-hover/query-editor:pointer-events-auto group-hover/query-editor:opacity-100">
											<ShadcnButton
												type="button"
												variant="ghost"
												size="icon-sm"
												onClick={() =>
													copyQuery(field.value ?? "")
												}
												disabled={
													!(field.value ?? "").trim()
												}
												aria-label="Copy query"
												title="Copy query"
												className="bg-background/80 backdrop-blur-sm"
											>
												<Copy size={16} />
											</ShadcnButton>
										</div>
										<button
											type="button"
											className="absolute right-0 bottom-0 left-0 h-3 cursor-row-resize"
											onMouseDown={handleQueryResizeStart}
											aria-label="Resize query editor height"
										>
											<div className="mx-2 mt-1 h-1 rounded bg-border/70 hover:bg-border" />
										</button>
									</div>
								</Field>
							);
						}}
					/>
					<ShadcnButton
						type="button"
						onClick={() => submitQuery()}
						disabled={disableButton || previewLoading}
						data-testid={"adminQueryPage-run-btn"}
						className="mt-4"
					>
						Run Query
						<ArrowRight size={18} />
					</ShadcnButton>
					<StyledRight>
						<div className="h-[420px] min-h-[240px]">
							<QueryResultsPanel
								previewData={previewData}
								previewLoading={previewLoading}
								clearResults={() => setPreviewData(null)}
							/>
						</div>
					</StyledRight>
				</Styledform>
			</StyledLeft>
		</StyledContainer>
	);
};
