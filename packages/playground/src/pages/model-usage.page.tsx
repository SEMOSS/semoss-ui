import {
	AlertCircle,
	ArrowDownToLine,
	ArrowUpFromLine,
	CalendarRange,
	CircleDollarSign,
	MessageSquare,
	RefreshCw,
	TrendingDown,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Small,
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

/** Format a credit value without hiding useful fractional amounts. */
const formatCredits = (
	value: number | null | undefined,
	locale: string,
): string => {
	if (typeof value !== "number" || !Number.isFinite(value)) return "—";
	return new Intl.NumberFormat(locale, {
		maximumFractionDigits: 6,
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
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

/** Return the rolling month ending today for the initial custom usage range. */
export const getLastMonthDateRange = (reference = new Date()) => {
	const targetYear =
		reference.getMonth() === 0
			? reference.getFullYear() - 1
			: reference.getFullYear();
	const targetMonth = (reference.getMonth() + 11) % 12;
	const lastDayInTargetMonth = new Date(
		targetYear,
		targetMonth + 1,
		0,
	).getDate();
	const startDate = new Date(
		targetYear,
		targetMonth,
		Math.min(reference.getDate(), lastDayInTargetMonth),
	);

	return {
		startDate: formatDateInput(startDate),
		endDate: formatDateInput(reference),
	};
};

/** Self-service dashboard for model credit limits, usage, and pricing. */
export const ModelUsagePage = () => {
	const { t, i18n } = useTranslation(["usage", "workspace"]);
	const modelSelectId = useId();
	const rangeSelectId = useId();
	const startDateId = useId();
	const endDateId = useId();
	const [models, setModels] = useState<Engine[]>([]);
	const [selectedModelId, setSelectedModelId] = useState("");
	const [creditInfo, setCreditInfo] = useState<ModelCreditInfo | null>(null);
	const [initialDateRange] = useState(() => getLastMonthDateRange());
	const [startDate, setStartDate] = useState(initialDateRange.startDate);
	const [endDate, setEndDate] = useState(initialDateRange.endDate);
	const [appliedStartDate, setAppliedStartDate] = useState(
		initialDateRange.startDate,
	);
	const [appliedEndDate, setAppliedEndDate] = useState(
		initialDateRange.endDate,
	);
	const [rangeMode, setRangeMode] = useState<"configured" | "custom">(
		"configured",
	);
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

	const loadUsage = useCallback(
		async (modelId: string, rangeStart?: string, rangeEnd?: string) => {
			if (!modelId) return;
			setIsLoadingUsage(true);
			setUsageError(false);
			try {
				const info =
					rangeStart && rangeEnd
						? await getUserModelCreditInfo(
								modelId,
								rangeStart,
								rangeEnd,
							)
						: await getUserModelCreditInfo(modelId);
				setCreditInfo(info);
				if (!rangeStart && !rangeEnd && !info.restrictionEnabled) {
					setRangeMode("custom");
				}
			} catch {
				setCreditInfo(null);
				setUsageError(true);
			} finally {
				setIsLoadingUsage(false);
			}
		},
		[],
	);

	useEffect(() => {
		loadModels();
	}, [loadModels]);

	useEffect(() => {
		if (!selectedModelId) {
			setCreditInfo(null);
		} else if (rangeMode === "configured") {
			loadUsage(selectedModelId);
		} else if (
			appliedStartDate &&
			appliedEndDate &&
			appliedStartDate <= appliedEndDate
		) {
			loadUsage(selectedModelId, appliedStartDate, appliedEndDate);
		} else {
			setCreditInfo(null);
		}
	}, [
		appliedEndDate,
		appliedStartDate,
		loadUsage,
		rangeMode,
		selectedModelId,
	]);

	const selectedModel = models.find(
		(model) => model.engine_id === selectedModelId,
	);
	const selectedUsageSummary = usageSummaries.find(
		(summary) => summary.ENGINE_ID === selectedModelId,
	);
	const overviewStartDate =
		rangeMode === "custom"
			? appliedStartDate
			: creditInfo?.periodStart?.slice(0, 10) || "";
	const overviewEndDate =
		rangeMode === "custom"
			? appliedEndDate
			: creditInfo?.periodEnd?.slice(0, 10) || "";

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
							if (rangeMode === "configured") {
								loadUsage(selectedModelId);
							} else {
								loadUsage(
									selectedModelId,
									appliedStartDate,
									appliedEndDate,
								);
							}
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
					<div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-5">
						<div className="flex flex-col gap-2">
							<Label htmlFor={modelSelectId}>
								{t("usage:model.label")}
							</Label>
							<Select
								value={selectedModelId}
								onValueChange={(modelId) => {
									setRangeMode("configured");
									setSelectedModelId(modelId);
								}}
							>
								<SelectTrigger
									id={modelSelectId}
									className="w-full"
								>
									<SelectValue
										placeholder={t(
											"usage:model.placeholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{models.map((model) => (
										<SelectItem
											key={model.engine_id}
											value={model.engine_id}
										>
											{model.engine_display_name ||
												model.engine_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={rangeSelectId}>
								{t("usage:dateRange.label")}
							</Label>
							<Select
								value={rangeMode}
								onValueChange={(value) =>
									setRangeMode(
										value as "configured" | "custom",
									)
								}
							>
								<SelectTrigger
									id={rangeSelectId}
									className="w-full"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem
										value="configured"
										disabled={
											!creditInfo?.restrictionEnabled
										}
									>
										{t("usage:dateRange.configured")}
										{creditInfo?.frequency
											? ` · ${t(`usage:frequency.${creditInfo.frequency}`)}`
											: ""}
									</SelectItem>
									<SelectItem value="custom">
										{t("usage:dateRange.custom")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
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
					<Card>
						<CardHeader>
							<CardTitle>{t("usage:overview.title")}</CardTitle>
							<CardDescription>
								{t("usage:overview.description", {
									start: overviewStartDate,
									end: overviewEndDate,
								})}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{overviewError ? (
								<Alert variant="destructive">
									<AlertCircle aria-hidden />
									<AlertTitle>
										{t("usage:overview.error")}
									</AlertTitle>
								</Alert>
							) : isLoadingOverview ? (
								<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
									<Skeleton className="h-40" />
									<Skeleton className="h-40" />
									<Skeleton className="h-40" />
								</div>
							) : (
								<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
									{usageSummaries.map((summary) => {
										const model = models.find(
											(item) =>
												item.engine_id ===
												summary.ENGINE_ID,
										);
										return (
											<button
												type="button"
												key={summary.ENGINE_ID}
												onClick={() => {
													setRangeMode("configured");
													setCreditInfo(null);
													setSelectedModelId(
														summary.ENGINE_ID,
													);
												}}
												className={`rounded-lg border p-4 text-left transition-colors hover:bg-muted/40 ${
													selectedModelId ===
													summary.ENGINE_ID
														? "border-primary ring-1 ring-primary"
														: "border-border"
												}`}
											>
												<div className="mb-3 truncate font-semibold">
													{model?.engine_display_name ||
														model?.engine_name ||
														summary.ENGINE_NAME ||
														summary.ENGINE_ID}
												</div>
												<div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
													<Muted>
														{t(
															"usage:overview.credits",
														)}
													</Muted>
													<span className="text-right font-medium">
														{formatCredits(
															summary.TOTAL_CREDITS,
															locale,
														)}
													</span>
													<Muted>
														{t(
															"usage:overview.requests",
														)}
													</Muted>
													<span className="text-right font-medium">
														{formatCredits(
															summary.TOTAL_REQUESTS,
															locale,
														)}
													</span>
													<Muted>
														{t(
															"usage:overview.inputTokens",
														)}
													</Muted>
													<span className="text-right font-medium">
														{formatCredits(
															summary.INPUT_TOKENS,
															locale,
														)}
													</span>
													<Muted>
														{t(
															"usage:overview.outputTokens",
														)}
													</Muted>
													<span className="text-right font-medium">
														{formatCredits(
															summary.RESPONSE_TOKENS,
															locale,
														)}
													</span>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>
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
						{!creditInfo.restrictionEnabled && (
							<Alert>
								<AlertCircle aria-hidden />
								<AlertTitle>
									{t("usage:noRestriction.title")}
								</AlertTitle>
								<AlertDescription>
									{t("usage:noRestriction.description")}
								</AlertDescription>
							</Alert>
						)}

						<div
							className={`grid gap-4 ${
								creditInfo.restrictionEnabled
									? "sm:grid-cols-3"
									: "sm:grid-cols-2 lg:grid-cols-4"
							}`}
						>
							<Card>
								<CardHeader>
									<TrendingUp
										className="size-5 text-primary"
										aria-hidden
									/>
									<CardDescription>
										{t("usage:metrics.used")}
									</CardDescription>
									<CardTitle className="text-2xl">
										{formatCredits(
											creditInfo.creditsUsed,
											locale,
										)}
									</CardTitle>
								</CardHeader>
							</Card>
							{creditInfo.restrictionEnabled ? (
								<>
									<Card>
										<CardHeader>
											<TrendingDown
												className="size-5 text-success"
												aria-hidden
											/>
											<CardDescription>
												{t("usage:metrics.remaining")}
											</CardDescription>
											<CardTitle className="text-2xl">
												{formatCredits(
													creditInfo.creditsRemaining,
													locale,
												)}
											</CardTitle>
										</CardHeader>
									</Card>
									<Card>
										<CardHeader>
											<CircleDollarSign
												className="size-5 text-primary"
												aria-hidden
											/>
											<CardDescription>
												{t("usage:metrics.limit")}
											</CardDescription>
											<CardTitle className="text-2xl">
												{formatCredits(
													creditInfo.maxCredits,
													locale,
												)}
											</CardTitle>
										</CardHeader>
									</Card>
								</>
							) : (
								<>
									<Card>
										<CardHeader>
											<MessageSquare
												className="size-5 text-primary"
												aria-hidden
											/>
											<CardDescription>
												{t("usage:overview.requests")}
											</CardDescription>
											<CardTitle className="text-2xl">
												{formatCredits(
													selectedUsageSummary?.TOTAL_REQUESTS,
													locale,
												)}
											</CardTitle>
										</CardHeader>
									</Card>
									<Card>
										<CardHeader>
											<ArrowDownToLine
												className="size-5 text-primary"
												aria-hidden
											/>
											<CardDescription>
												{t(
													"usage:overview.inputTokens",
												)}
											</CardDescription>
											<CardTitle className="text-2xl">
												{formatCredits(
													selectedUsageSummary?.INPUT_TOKENS,
													locale,
												)}
											</CardTitle>
										</CardHeader>
									</Card>
									<Card>
										<CardHeader>
											<ArrowUpFromLine
												className="size-5 text-primary"
												aria-hidden
											/>
											<CardDescription>
												{t(
													"usage:overview.outputTokens",
												)}
											</CardDescription>
											<CardTitle className="text-2xl">
												{formatCredits(
													selectedUsageSummary?.RESPONSE_TOKENS,
													locale,
												)}
											</CardTitle>
										</CardHeader>
									</Card>
								</>
							)}
						</div>

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
