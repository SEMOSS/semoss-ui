import {
	AlertCircle,
	ArrowDownToLine,
	ArrowUpFromLine,
	CalendarRange,
	MessageSquare,
	RefreshCw,
	TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	H3,
	Input,
	Label,
	Muted,
	Progress,
	Skeleton,
	Small,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import {
	getUsageModels,
	getUserModelCreditInfo,
	getUserModelUsage,
	type ModelCreditInfo,
	type ModelUsageSummary,
} from "@/api";
import { useGlobalBreadcrumbs } from "@/hooks";
import type { Engine } from "@/types";

/** Format credits as a currency-like value without noisy storage precision. */
export const formatCredits = (
	value: number | null | undefined,
	locale: string,
): string => {
	if (typeof value !== "number" || !Number.isFinite(value)) return "—";
	return new Intl.NumberFormat(locale, {
		maximumFractionDigits: 2,
	}).format(value);
};

/** Format count metrics as localized whole numbers. */
const formatCount = (
	value: number | null | undefined,
	locale: string,
): string => {
	if (typeof value !== "number" || !Number.isFinite(value)) return "—";
	return new Intl.NumberFormat(locale, {
		maximumFractionDigits: 0,
	}).format(value);
};

/** Display an ISO timestamp in the viewer's locale. */
const formatDate = (value: string | null, locale: string): string => {
	if (!value) return "—";
	return new Intl.DateTimeFormat(locale, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
};

const formatDateInput = (date: Date): string => {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const formatDateOnly = (value: string, locale: string): string => {
	const [year, month, day] = value.split("-").map(Number);
	return new Intl.DateTimeFormat(locale, {
		dateStyle: "medium",
		timeZone: "UTC",
	}).format(new Date(Date.UTC(year, month - 1, day)));
};

type UsageRangeMode = "today" | "week" | "month" | "custom";

/** Return an inclusive, calendar-based usage range ending today. */
export const getPresetDateRange = (
	mode: Exclude<UsageRangeMode, "custom">,
	reference = new Date(),
) => {
	const startDate = new Date(reference);
	if (mode === "week") {
		startDate.setUTCDate(reference.getUTCDate() - reference.getUTCDay());
	} else if (mode === "month") {
		startDate.setUTCDate(1);
	}

	return {
		startDate: formatDateInput(startDate),
		endDate: formatDateInput(reference),
	};
};

/** Self-service dashboard for model credit limits and usage. */
export const ModelUsagePage = () => {
	const { t, i18n } = useTranslation(["usage", "workspace"]);
	const startDateId = useId();
	const endDateId = useId();
	const [models, setModels] = useState<Engine[]>([]);
	const [selectedModelId, setSelectedModelId] = useState("");
	const [creditInfo, setCreditInfo] = useState<ModelCreditInfo | null>(null);
	const [initialDateRange] = useState(() => getPresetDateRange("month"));
	const [startDate, setStartDate] = useState(initialDateRange.startDate);
	const [endDate, setEndDate] = useState(initialDateRange.endDate);
	const [appliedStartDate, setAppliedStartDate] = useState(
		initialDateRange.startDate,
	);
	const [appliedEndDate, setAppliedEndDate] = useState(
		initialDateRange.endDate,
	);
	const [rangeMode, setRangeMode] = useState<UsageRangeMode>("month");
	const [isLoadingModels, setIsLoadingModels] = useState(true);
	const [isLoadingUsage, setIsLoadingUsage] = useState(false);
	const [modelsError, setModelsError] = useState(false);
	const [usageError, setUsageError] = useState(false);
	const [usageSummaries, setUsageSummaries] = useState<ModelUsageSummary[]>(
		[],
	);
	const [isLoadingOverview, setIsLoadingOverview] = useState(false);
	const [overviewError, setOverviewError] = useState(false);

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: t("workspace:breadcrumbs.home"), path: "/" },
			{ name: t("usage:title"), path: "/usage" },
		],
	});

	const loadModels = useCallback(async () => {
		setIsLoadingModels(true);
		setModelsError(false);
		try {
			const availableModels = await getUsageModels();
			setModels(availableModels);
			setSelectedModelId((current) =>
				availableModels.some((model) => model.engine_id === current)
					? current
					: availableModels[0]?.engine_id || "",
			);
		} catch {
			setModelsError(true);
		} finally {
			setIsLoadingModels(false);
		}
	}, []);

	const loadUsage = useCallback(async (modelId: string) => {
		if (!modelId) return;
		setIsLoadingUsage(true);
		setUsageError(false);
		try {
			const info = await getUserModelCreditInfo(modelId);
			setCreditInfo(info);
		} catch {
			setCreditInfo(null);
			setUsageError(true);
		} finally {
			setIsLoadingUsage(false);
		}
	}, []);

	useEffect(() => {
		loadModels();
	}, [loadModels]);

	useEffect(() => {
		if (!selectedModelId) {
			setCreditInfo(null);
		} else {
			loadUsage(selectedModelId);
		}
	}, [loadUsage, selectedModelId]);

	const selectedModel = models.find(
		(model) => model.engine_id === selectedModelId,
	);
	const overviewStartDate = appliedStartDate;
	const overviewEndDate = appliedEndDate;

	const loadOverview = useCallback(
		async (rangeStart: string, rangeEnd: string) => {
			if (!rangeStart || !rangeEnd || models.length === 0) return;
			setIsLoadingOverview(true);
			setOverviewError(false);
			try {
				const summaries = await getUserModelUsage(
					models.map((model) => model.engine_id),
					rangeStart,
					rangeEnd,
				);
				setUsageSummaries(
					[...summaries].sort(
						(a, b) =>
							(b.TOTAL_CREDITS || 0) - (a.TOTAL_CREDITS || 0) ||
							(b.TOTAL_TOKENS || 0) - (a.TOTAL_TOKENS || 0),
					),
				);
			} catch {
				setUsageSummaries([]);
				setOverviewError(true);
			} finally {
				setIsLoadingOverview(false);
			}
		},
		[models],
	);

	useEffect(() => {
		loadOverview(overviewStartDate, overviewEndDate);
	}, [loadOverview, overviewEndDate, overviewStartDate]);
	const usagePercent = useMemo<number | null>(() => {
		if (
			!creditInfo ||
			!creditInfo.restrictionEnabled ||
			creditInfo.rangeType === "CUSTOM" ||
			typeof creditInfo.maxCredits !== "number" ||
			!Number.isFinite(creditInfo.maxCredits) ||
			typeof creditInfo.creditsUsed !== "number" ||
			!Number.isFinite(creditInfo.creditsUsed)
		)
			return null;
		if (creditInfo.maxCredits <= 0) {
			return creditInfo.creditsUsed > 0 ? 100 : 0;
		}
		return Math.min(
			100,
			Math.max(0, (creditInfo.creditsUsed / creditInfo.maxCredits) * 100),
		);
	}, [creditInfo]);
	const usageTotals = useMemo(
		() =>
			usageSummaries.reduce(
				(totals, summary) => ({
					credits: totals.credits + (summary.TOTAL_CREDITS || 0),
					requests: totals.requests + (summary.TOTAL_REQUESTS || 0),
					inputTokens:
						totals.inputTokens + (summary.INPUT_TOKENS || 0),
					outputTokens:
						totals.outputTokens + (summary.RESPONSE_TOKENS || 0),
				}),
				{ credits: 0, requests: 0, inputTokens: 0, outputTokens: 0 },
			),
		[usageSummaries],
	);
	const locale = i18n.resolvedLanguage || i18n.language || "en";

	return (
		<div className="h-full w-full overflow-y-auto bg-background">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
					<div className="flex max-w-prose flex-col gap-2">
						<H3>{t("usage:title")}</H3>
						<Muted>{t("usage:description")}</Muted>
					</div>
					<Button
						variant="outline"
						onClick={() => {
							loadUsage(selectedModelId);
							loadOverview(overviewStartDate, overviewEndDate);
						}}
						disabled={
							!selectedModelId ||
							(rangeMode === "custom" &&
								(!startDate ||
									!endDate ||
									startDate > endDate)) ||
							isLoadingUsage
						}
					>
						<RefreshCw
							className={
								isLoadingUsage ? "animate-spin" : undefined
							}
							aria-hidden
						/>
						{t("usage:refresh")}
					</Button>
				</div>

				{modelsError ? (
					<Alert variant="destructive">
						<AlertCircle aria-hidden />
						<AlertTitle>{t("usage:modelsError.title")}</AlertTitle>
						<AlertDescription>
							{t("usage:modelsError.description")}
							<Button
								variant="outline"
								size="sm"
								onClick={loadModels}
							>
								{t("usage:retry")}
							</Button>
						</AlertDescription>
					</Alert>
				) : isLoadingModels ? (
					<Skeleton className="h-9 w-full max-w-md" />
				) : models.length === 0 ? (
					<Card>
						<CardHeader>
							<CardTitle>{t("usage:empty.title")}</CardTitle>
							<CardDescription>
								{t("usage:empty.description")}
							</CardDescription>
						</CardHeader>
					</Card>
				) : (
					<div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-4">
						<fieldset className="flex flex-col gap-2 lg:col-span-4">
							<legend className="font-medium text-sm">
								{t("usage:dateRange.label")}
							</legend>
							<div className="flex flex-wrap gap-2">
								{(
									[
										"today",
										"week",
										"month",
										"custom",
									] as const
								).map((mode) => (
									<Button
										key={mode}
										type="button"
										variant={
											rangeMode === mode
												? "default"
												: "outline"
										}
										onClick={() => {
											setRangeMode(mode);
											if (mode !== "custom") {
												const range =
													getPresetDateRange(mode);
												setStartDate(range.startDate);
												setEndDate(range.endDate);
												setAppliedStartDate(
													range.startDate,
												);
												setAppliedEndDate(
													range.endDate,
												);
											}
										}}
									>
										{t(`usage:dateRange.${mode}`)}
									</Button>
								))}
							</div>
						</fieldset>
						{rangeMode === "custom" && (
							<>
								<div className="flex flex-col gap-2">
									<Label htmlFor={startDateId}>
										{t("usage:dateRange.start")}
									</Label>
									<Input
										id={startDateId}
										type="date"
										value={startDate}
										max={endDate}
										onChange={(event) =>
											setStartDate(event.target.value)
										}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor={endDateId}>
										{t("usage:dateRange.end")}
									</Label>
									<Input
										id={endDateId}
										type="date"
										value={endDate}
										min={startDate}
										onChange={(event) =>
											setEndDate(event.target.value)
										}
									/>
								</div>
								<div className="flex items-end">
									<Button
										className="w-full"
										disabled={
											!startDate ||
											!endDate ||
											startDate > endDate ||
											(startDate === appliedStartDate &&
												endDate === appliedEndDate)
										}
										onClick={() => {
											setAppliedStartDate(startDate);
											setAppliedEndDate(endDate);
										}}
									>
										{t("usage:dateRange.apply")}
									</Button>
								</div>
							</>
						)}
					</div>
				)}

				{usageError && (
					<Alert variant="destructive">
						<AlertCircle aria-hidden />
						<AlertTitle>{t("usage:usageError.title")}</AlertTitle>
						<AlertDescription>
							{t("usage:usageError.description")}
						</AlertDescription>
					</Alert>
				)}

				{models.length > 0 && overviewStartDate && overviewEndDate && (
					<div className="contents">
						{overviewError ? (
							<Alert variant="destructive">
								<AlertCircle aria-hidden />
								<AlertTitle>
									{t("usage:overview.error")}
								</AlertTitle>
							</Alert>
						) : isLoadingOverview ? (
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								{["credits", "requests", "input", "output"].map(
									(key) => (
										<Skeleton key={key} className="h-32" />
									),
								)}
							</div>
						) : (
							<>
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
									{[
										{
											label: t("usage:overview.credits"),
											value: usageTotals.credits,
											icon: TrendingUp,
											format: formatCredits,
										},
										{
											label: t("usage:overview.requests"),
											value: usageTotals.requests,
											icon: MessageSquare,
											format: formatCount,
										},
										{
											label: t(
												"usage:overview.inputTokens",
											),
											value: usageTotals.inputTokens,
											icon: ArrowDownToLine,
											format: formatCount,
										},
										{
											label: t(
												"usage:overview.outputTokens",
											),
											value: usageTotals.outputTokens,
											icon: ArrowUpFromLine,
											format: formatCount,
										},
									].map(
										({
											label,
											value,
											icon: Icon,
											format,
										}) => (
											<Card key={label}>
												<CardHeader>
													<Icon
														className="size-5 text-primary"
														aria-hidden
													/>
													<CardDescription>
														{label}
													</CardDescription>
													<CardTitle className="text-2xl tabular-nums">
														{format(value, locale)}
													</CardTitle>
												</CardHeader>
											</Card>
										),
									)}
								</div>

								<Card>
									<CardHeader>
										<CardTitle>
											{t("usage:overview.title")}
										</CardTitle>
										<CardDescription>
											{t("usage:overview.description", {
												start: formatDateOnly(
													overviewStartDate,
													locale,
												),
												end: formatDateOnly(
													overviewEndDate,
													locale,
												),
											})}
										</CardDescription>
									</CardHeader>
									<CardContent className="overflow-x-auto p-0">
										<Table>
											<TableHeader>
												<TableRow className="hover:bg-transparent">
													<TableHead>
														{t("usage:model.label")}
													</TableHead>
													<TableHead>
														{t(
															"usage:restriction.label",
														)}
													</TableHead>
													<TableHead className="text-right">
														{t(
															"usage:overview.credits",
														)}
													</TableHead>
													<TableHead className="text-right">
														{t(
															"usage:overview.requests",
														)}
													</TableHead>
													<TableHead className="text-right">
														{t(
															"usage:overview.inputTokens",
														)}
													</TableHead>
													<TableHead className="text-right">
														{t(
															"usage:overview.outputTokens",
														)}
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{usageSummaries.map(
													(summary) => {
														const model =
															models.find(
																(item) =>
																	item.engine_id ===
																	summary.ENGINE_ID,
															);
														return (
															<TableRow
																key={
																	summary.ENGINE_ID
																}
																className={
																	selectedModelId ===
																	summary.ENGINE_ID
																		? "bg-muted/50"
																		: undefined
																}
															>
																<TableCell className="max-w-72 whitespace-normal font-medium">
																	<button
																		type="button"
																		className="text-left hover:text-primary hover:underline"
																		onClick={() =>
																			setSelectedModelId(
																				summary.ENGINE_ID,
																			)
																		}
																	>
																		{model?.engine_display_name ||
																			model?.engine_name ||
																			summary.ENGINE_NAME ||
																			summary.ENGINE_ID}
																	</button>
																</TableCell>
																<TableCell>
																	{summary.HAS_RESTRICTION && (
																		<Badge variant="outline">
																			{t(
																				"usage:restriction.restricted",
																			)}
																		</Badge>
																	)}
																</TableCell>
																{[
																	{
																		key: "credits",
																		value: summary.TOTAL_CREDITS,
																		format: formatCredits,
																	},
																	{
																		key: "requests",
																		value: summary.TOTAL_REQUESTS,
																		format: formatCount,
																	},
																	{
																		key: "input",
																		value: summary.INPUT_TOKENS,
																		format: formatCount,
																	},
																	{
																		key: "output",
																		value: summary.RESPONSE_TOKENS,
																		format: formatCount,
																	},
																].map(
																	({
																		key,
																		value,
																		format,
																	}) => (
																		<TableCell
																			key={
																				key
																			}
																			className="text-right tabular-nums"
																		>
																			{format(
																				value,
																				locale,
																			)}
																		</TableCell>
																	),
																)}
															</TableRow>
														);
													},
												)}
											</TableBody>
										</Table>
									</CardContent>
								</Card>
							</>
						)}
					</div>
				)}

				{isLoadingUsage && selectedModelId ? (
					<div
						className="grid gap-4 sm:grid-cols-3"
						aria-live="polite"
					>
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
					</div>
				) : creditInfo ? (
					<>
						{!creditInfo.trackingEnabled && (
							<Alert>
								<AlertCircle aria-hidden />
								<AlertTitle>
									{t("usage:trackingDisabled.title")}
								</AlertTitle>
								<AlertDescription>
									{t("usage:trackingDisabled.description")}
								</AlertDescription>
							</Alert>
						)}
						{usagePercent !== null && (
							<Card>
								<CardHeader>
									<CardTitle>
										{t("usage:period.title")}
									</CardTitle>
									<CardDescription>
										{selectedModel?.engine_display_name ||
											selectedModel?.engine_name}
									</CardDescription>
								</CardHeader>
								<CardContent className="flex flex-col gap-4">
									<div className="grid gap-3 sm:grid-cols-3">
										{[
											{
												label: t("usage:metrics.used"),
												value: creditInfo.creditsUsed,
											},
											{
												label: t(
													"usage:metrics.remaining",
												),
												value: creditInfo.creditsRemaining,
											},
											{
												label: t("usage:metrics.limit"),
												value: creditInfo.maxCredits,
											},
										].map(({ label, value }) => (
											<div
												key={label}
												className="rounded-lg border p-3"
											>
												<Muted>{label}</Muted>
												<div className="mt-1 font-semibold text-lg tabular-nums">
													{formatCredits(
														value,
														locale,
													)}
												</div>
											</div>
										))}
									</div>
									<div className="flex items-center justify-between gap-4">
										<Muted>
											{t("usage:period.consumed")}
										</Muted>
										<Badge
											variant={
												creditInfo.limitExceeded
													? "destructive"
													: "outline"
											}
										>
											{Math.round(usagePercent)}%
											{creditInfo.limitExceeded
												? ` · ${t("usage:period.exceeded")}`
												: ""}
										</Badge>
									</div>
									<Progress
										value={usagePercent}
										aria-label={t(
											"usage:period.progressLabel",
										)}
									/>
									<div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
										<div className="flex items-center gap-2">
											<CalendarRange
												className="size-4 text-muted-foreground"
												aria-hidden
											/>
											<Small>
												{formatDate(
													creditInfo.periodStart,
													locale,
												)}{" "}
												–{" "}
												{formatDate(
													creditInfo.periodEnd,
													locale,
												)}
											</Small>
										</div>
										<Muted>
											{creditInfo.frequency
												? t(
														`usage:frequency.${creditInfo.frequency}`,
													)
												: "—"}
										</Muted>
									</div>
								</CardContent>
							</Card>
						)}
					</>
				) : null}
			</div>
		</div>
	);
};
