import {
	AlertCircle,
	CalendarRange,
	CircleDollarSign,
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
	Label,
	Large,
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
	type ModelCreditInfo,
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

/** Self-service dashboard for model credit limits, usage, and pricing. */
export const ModelUsagePage = () => {
	const { t, i18n } = useTranslation(["usage", "workspace"]);
	const modelSelectId = useId();
	const [models, setModels] = useState<Engine[]>([]);
	const [selectedModelId, setSelectedModelId] = useState("");
	const [creditInfo, setCreditInfo] = useState<ModelCreditInfo | null>(null);
	const [isLoadingModels, setIsLoadingModels] = useState(true);
	const [isLoadingUsage, setIsLoadingUsage] = useState(false);
	const [modelsError, setModelsError] = useState(false);
	const [usageError, setUsageError] = useState(false);

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
			setCreditInfo(await getUserModelCreditInfo(modelId));
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
		if (selectedModelId) {
			loadUsage(selectedModelId);
		} else {
			setCreditInfo(null);
		}
	}, [loadUsage, selectedModelId]);

	const selectedModel = models.find(
		(model) => model.engine_id === selectedModelId,
	);
	const usagePercent = useMemo<number | null>(() => {
		if (
			!creditInfo ||
			!creditInfo.restrictionEnabled ||
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
						onClick={() => loadUsage(selectedModelId)}
						disabled={!selectedModelId || isLoadingUsage}
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
					<div className="flex w-full max-w-md flex-col gap-2">
						<Label htmlFor={modelSelectId}>
							{t("usage:model.label")}
						</Label>
						<Select
							value={selectedModelId}
							onValueChange={setSelectedModelId}
						>
							<SelectTrigger
								id={modelSelectId}
								className="w-full"
							>
								<SelectValue
									placeholder={t("usage:model.placeholder")}
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

						<div className="grid gap-4 sm:grid-cols-3">
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

						<Card>
							<CardHeader>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<CardTitle>
										{t("usage:pricing.title")}
									</CardTitle>
									<Badge
										variant={
											creditInfo.pricingConfigured
												? "outline"
												: "secondary"
										}
									>
										{creditInfo.pricingConfigured
											? t("usage:pricing.configured")
											: t("usage:pricing.notConfigured")}
									</Badge>
								</div>
								<CardDescription>
									{t("usage:pricing.description")}
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 sm:grid-cols-2">
								<div className="rounded-lg border border-border p-4">
									<Muted>{t("usage:pricing.input")}</Muted>
									<Large className="mt-2">
										{formatCredits(
											creditInfo.inputCreditsPerMillion,
											locale,
										)}{" "}
										{t("usage:pricing.perMillion")}
									</Large>
								</div>
								<div className="rounded-lg border border-border p-4">
									<Muted>{t("usage:pricing.output")}</Muted>
									<Large className="mt-2">
										{formatCredits(
											creditInfo.outputCreditsPerMillion,
											locale,
										)}{" "}
										{t("usage:pricing.perMillion")}
									</Large>
								</div>
								<div className="rounded-lg border border-border p-4">
									<Muted>
										{t("usage:pricing.cacheRead")}
									</Muted>
									<Large className="mt-2">
										{formatCredits(
											creditInfo.cacheReadMultiplier,
											locale,
										)}
										{typeof creditInfo.cacheReadMultiplier ===
											"number" &&
										Number.isFinite(
											creditInfo.cacheReadMultiplier,
										)
											? "×"
											: ""}
									</Large>
								</div>
								<div className="rounded-lg border border-border p-4">
									<Muted>
										{t("usage:pricing.cacheWrite")}
									</Muted>
									<Large className="mt-2">
										{formatCredits(
											creditInfo.cacheWriteMultiplier,
											locale,
										)}
										{typeof creditInfo.cacheWriteMultiplier ===
											"number" &&
										Number.isFinite(
											creditInfo.cacheWriteMultiplier,
										)
											? "×"
											: ""}
									</Large>
								</div>
							</CardContent>
						</Card>
					</>
				) : null}
			</div>
		</div>
	);
};
