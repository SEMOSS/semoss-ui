import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Env, get, post } from "@semoss/sdk/react";
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Switch,
	toast,
} from "@semoss/ui/next";
import { TIME_PERIOD_LABELS } from "../constants";
import type { ExceptionEntry, TimePeriod, TokenLimitEntry } from "../types";
import { AddLimitDialog } from "./add-limit-dialog";
import { EditableLimitRow } from "./editable-limit-row";
import { EntityDetailRow } from "./entity-detail-row";
import { ExceptionsSection } from "./exceptions-section";

interface TokenLimitsPanelProps {
	entityType: "MODEL" | "APP";
	entityId: string;
	entityName: string;
}

interface LimitValues {
	period: TimePeriod;
	maxTokens: number;
	maxInputTokens: number;
	maxOutputTokens: number;
	isActive: boolean;
}

interface MemberPermissionUser {
	id: string;
	name: string;
	type: string;
	email: string;
	permission: string;
	usage_restriction?: string;
	usage_frequency?: string;
	max_tokens?: number;
	max_input_tokens?: number;
	max_output_tokens?: number;
}

interface ModelPlatformUsageLimit {
	engineId: string;
	usageFrequency: TimePeriod;
	maxTokens: number;
	maxInputTokens: number;
	maxOutputTokens: number;
	maxResponseTime: number;
	isActive: boolean;
	tokensUsed: number;
	inputTokensUsed: number;
	outputTokensUsed: number;
	computeTimeUsed: number;
}

const PERIODS = Object.keys(TIME_PERIOD_LABELS) as TimePeriod[];

const DEFAULT_LIMIT_DRAFT: TokenLimitEntry = {
	id: "default-user-limit",
	period: "DAY",
	maxTokens: 100000,
	maxInputTokens: 60000,
	maxOutputTokens: 40000,
	isActive: true,
	_saved: {
		period: "DAY",
		maxTokens: 100000,
		maxInputTokens: 60000,
		maxOutputTokens: 40000,
		isActive: true,
	},
};

const createDraftFromValues = (values: LimitValues): TokenLimitEntry => ({
	id: "default-user-limit",
	period: values.period,
	maxTokens: values.maxTokens,
	maxInputTokens: values.maxInputTokens,
	maxOutputTokens: values.maxOutputTokens,
	isActive: values.isActive,
	_saved: {
		period: values.period,
		maxTokens: values.maxTokens,
		maxInputTokens: values.maxInputTokens,
		maxOutputTokens: values.maxOutputTokens,
		isActive: values.isActive,
	},
});

const areLimitsEqual = (a: LimitValues, b: LimitValues) =>
	a.period === b.period &&
	a.maxTokens === b.maxTokens &&
	a.maxInputTokens === b.maxInputTokens &&
	a.maxOutputTokens === b.maxOutputTokens &&
	a.isActive === b.isActive;

export function TokenLimitsPanel({
	entityType,
	entityId,
	entityName,
}: TokenLimitsPanelProps) {
	const isModel = entityType === "MODEL";
	const entityTypeLabel = entityType === "MODEL" ? "model" : "app";
	const [loading, setLoading] = useState(true);
	const [members, setMembers] = useState<MemberPermissionUser[]>([]);
	const [defaultUserLimit, setDefaultUserLimit] =
		useState<TokenLimitEntry | null>(null);
	const [defaultUserLimitDraft, setDefaultUserLimitDraft] =
		useState<TokenLimitEntry>(DEFAULT_LIMIT_DRAFT);
	const [userExceptions, setUserExceptions] = useState<ExceptionEntry[]>([]);
	const [platformLimits, setPlatformLimits] = useState<TokenLimitEntry[]>([]);
	const [platformUsageByPeriod, setPlatformUsageByPeriod] = useState<
		Record<TimePeriod, Omit<ModelPlatformUsageLimit, "usageFrequency">>
	>(
		{} as Record<
			TimePeriod,
			Omit<ModelPlatformUsageLimit, "usageFrequency">
		>,
	);
	const [showPlatformAddDialog, setShowPlatformAddDialog] = useState(false);
	const [savingExceptionIds, setSavingExceptionIds] = useState<Set<string>>(
		new Set(),
	);
	const [savingPlatformIds, setSavingPlatformIds] = useState<Set<string>>(
		new Set(),
	);
	const [savingDefaultLimit, setSavingDefaultLimit] = useState(false);
	const defaultUserLimitRef = useRef<TokenLimitEntry | null>(null);

	const [newPeriod, setNewPeriod] = useState<TimePeriod>("HOUR");
	const [newMaxTokens, setNewMaxTokens] = useState("100000");
	const [newMaxInput, setNewMaxInput] = useState("60000");
	const [newMaxOutput, setNewMaxOutput] = useState("40000");

	const entityPath = entityType === "MODEL" ? "engine" : "project";
	const entityIdKey = entityType === "MODEL" ? "engineId" : "projectId";
	const getUsersEndpoint =
		entityType === "MODEL" ? "getEngineUsers" : "getProjectUsers";
	const editUsersEndpoint =
		entityType === "MODEL"
			? "editEngineUserPermissions"
			: "editProjectUserPermissions";

	const mapFrequency = useCallback((value?: string | null): TimePeriod => {
		if (!value) return "DAY";
		const upper = value.toUpperCase() as TimePeriod;
		return PERIODS.includes(upper) ? upper : "DAY";
	}, []);

	const parseLimit = useCallback((value?: number | null): number => {
		if (value == null || Number.isNaN(value) || value < 0) {
			return 0;
		}
		return value;
	}, []);

	const toTokenLimitEntry = useCallback(
		(limit: {
			usageFrequency?: string | null;
			maxTokens?: number | null;
			maxInputTokens?: number | null;
			maxOutputTokens?: number | null;
			isActive?: boolean | null;
		}) => {
			const values: LimitValues = {
				period: mapFrequency(limit.usageFrequency),
				maxTokens: parseLimit(limit.maxTokens),
				maxInputTokens: parseLimit(limit.maxInputTokens),
				maxOutputTokens: parseLimit(limit.maxOutputTokens),
				isActive: limit.isActive !== false,
			};
			return createDraftFromValues(values);
		},
		[mapFrequency, parseLimit],
	);

	const getMemberLimitValues = useCallback(
		(member: MemberPermissionUser): LimitValues => ({
			period: mapFrequency(member.usage_frequency),
			maxTokens: parseLimit(member.max_tokens),
			maxInputTokens: parseLimit(member.max_input_tokens),
			maxOutputTokens: parseLimit(member.max_output_tokens),
			isActive: true,
		}),
		[mapFrequency, parseLimit],
	);

	const hasConfiguredLimit = useCallback((member: MemberPermissionUser) => {
		const hasTokens =
			(member.max_tokens ?? 0) > 0 ||
			(member.max_input_tokens ?? 0) > 0 ||
			(member.max_output_tokens ?? 0) > 0;
		return hasTokens || !!member.usage_frequency;
	}, []);

	const toExceptionEntry = useCallback(
		(member: MemberPermissionUser): ExceptionEntry => ({
			entityId: member.id,
			entityName: member.name || member.id,
			entityDetails: [
				{ label: "ID", value: member.id },
				{ label: "Email", value: member.email || "N/A" },
			],
			combinedLimit: parseLimit(member.max_tokens),
			inputLimit: parseLimit(member.max_input_tokens),
			outputLimit: parseLimit(member.max_output_tokens),
			period: mapFrequency(member.usage_frequency),
			isActive: true,
		}),
		[mapFrequency, parseLimit],
	);

	const syncDefaultAndExceptionsFromMembers = useCallback(
		(nextMembers: MemberPermissionUser[]) => {
			const resolvedDefault = defaultUserLimitRef.current;

			const nextExceptions = nextMembers
				.filter(hasConfiguredLimit)
				.filter((member) => {
					if (!resolvedDefault) return true;
					const memberValues = getMemberLimitValues(member);
					const defaultValues: LimitValues = {
						period: resolvedDefault.period,
						maxTokens: resolvedDefault.maxTokens,
						maxInputTokens: resolvedDefault.maxInputTokens ?? 0,
						maxOutputTokens: resolvedDefault.maxOutputTokens ?? 0,
						isActive: resolvedDefault.isActive,
					};
					return !areLimitsEqual(memberValues, defaultValues);
				})
				.map(toExceptionEntry);

			setUserExceptions(nextExceptions);
		},
		[getMemberLimitValues, hasConfiguredLimit, toExceptionEntry],
	);

	const fetchDefaultUserLimit = useCallback(async () => {
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/getEngineDefaultTokenLimit?engineId=${encodeURIComponent(entityId)}`
				: `${Env.MODULE}/api/auth/project/getProjectDefaultTokenLimit?projectId=${encodeURIComponent(entityId)}`;
			const response = await get<{
				usageFrequency?: string | null;
				maxTokens?: number | null;
				maxInputTokens?: number | null;
				maxOutputTokens?: number | null;
				isActive?: boolean | null;
			} | null>(url);
			const raw = response?.data;
			if (!raw) {
				setDefaultUserLimit(null);
				defaultUserLimitRef.current = null;
				setDefaultUserLimitDraft(DEFAULT_LIMIT_DRAFT);
				return;
			}

			const mapped = toTokenLimitEntry(raw);
			setDefaultUserLimit(mapped);
			defaultUserLimitRef.current = mapped;
			setDefaultUserLimitDraft(mapped);
		} catch {
			// Backward compatibility: old backends may not expose default-limit endpoints yet.
			setDefaultUserLimit(null);
			defaultUserLimitRef.current = null;
			setDefaultUserLimitDraft(DEFAULT_LIMIT_DRAFT);
		}
	}, [entityId, isModel, toTokenLimitEntry]);

	const fetchMemberLimits = useCallback(async () => {
		const url = `${Env.MODULE}/api/auth/${entityPath}/${getUsersEndpoint}?${entityIdKey}=${encodeURIComponent(entityId)}&limit=1000&offset=0`;
		const response = await get<{ members?: MemberPermissionUser[] }>(url);
		const memberList = Array.isArray(response?.data?.members)
			? response.data.members
			: [];
		setMembers(memberList);
		syncDefaultAndExceptionsFromMembers(memberList);
	}, [
		entityId,
		entityIdKey,
		entityPath,
		getUsersEndpoint,
		syncDefaultAndExceptionsFromMembers,
	]);

	const fetchPlatformLimits = useCallback(async () => {
		if (!isModel) return;
		const url = `${Env.MODULE}/api/auth/engine/getModelPlatformTokenUsage?engineId=${encodeURIComponent(entityId)}`;
		const response = await get<ModelPlatformUsageLimit[]>(url);
		const rows = Array.isArray(response?.data) ? response.data : [];

		setPlatformLimits(
			rows.map((row) => {
				const period = mapFrequency(row.usageFrequency);
				const maxTokens = parseLimit(row.maxTokens);
				const maxInputTokens = parseLimit(row.maxInputTokens);
				const maxOutputTokens = parseLimit(row.maxOutputTokens);
				const isActive = row.isActive !== false;
				return {
					id: `platform-${period}`,
					period,
					maxTokens,
					maxInputTokens,
					maxOutputTokens,
					isActive,
					_saved: {
						period,
						maxTokens,
						maxInputTokens,
						maxOutputTokens,
						isActive,
					},
				};
			}),
		);

		const usageIndex = {} as Record<
			TimePeriod,
			Omit<ModelPlatformUsageLimit, "usageFrequency">
		>;
		rows.forEach((row) => {
			const period = mapFrequency(row.usageFrequency);
			usageIndex[period] = {
				engineId: row.engineId,
				maxTokens: parseLimit(row.maxTokens),
				maxInputTokens: parseLimit(row.maxInputTokens),
				maxOutputTokens: parseLimit(row.maxOutputTokens),
				maxResponseTime:
					typeof row.maxResponseTime === "number"
						? row.maxResponseTime
						: 0,
				isActive: row.isActive !== false,
				tokensUsed: parseLimit(row.tokensUsed),
				inputTokensUsed: parseLimit(row.inputTokensUsed),
				outputTokensUsed: parseLimit(row.outputTokensUsed),
				computeTimeUsed:
					typeof row.computeTimeUsed === "number"
						? row.computeTimeUsed
						: 0,
			};
		});
		setPlatformUsageByPeriod(usageIndex);
	}, [entityId, isModel, mapFrequency, parseLimit]);

	const refreshData = useCallback(async () => {
		setLoading(true);
		try {
			await fetchDefaultUserLimit();
			await fetchMemberLimits();
			if (isModel) {
				await fetchPlatformLimits();
			}
		} catch (e) {
			console.error("Failed to fetch token limits", e);
			toast.error("Failed to load token limits");
		} finally {
			setLoading(false);
		}
	}, [
		fetchDefaultUserLimit,
		fetchMemberLimits,
		fetchPlatformLimits,
		isModel,
	]);

	useEffect(() => {
		refreshData();
	}, [refreshData]);

	const saveDefaultUserLimit = async () => {
		setSavingDefaultLimit(true);
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/setEngineDefaultTokenLimit`
				: `${Env.MODULE}/api/auth/project/setProjectDefaultTokenLimit`;
			await post(url, {
				[entityIdKey]: entityId,
				usageFrequency: defaultUserLimitDraft.period,
				maxTokens: defaultUserLimitDraft.maxTokens,
				maxInputTokens: defaultUserLimitDraft.maxInputTokens ?? 0,
				maxOutputTokens: defaultUserLimitDraft.maxOutputTokens ?? 0,
				isActive: defaultUserLimitDraft.isActive,
				restrictPerModel: false,
			});
			await fetchDefaultUserLimit();
			await fetchMemberLimits();
			toast.success("Default user limits saved");
		} catch (e) {
			console.error("Failed to save default user limits", e);
			toast.error("Failed to save default user limits");
		} finally {
			setSavingDefaultLimit(false);
		}
	};

	const removeDefaultUserLimit = async () => {
		setSavingDefaultLimit(true);
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/removeEngineDefaultTokenLimit`
				: `${Env.MODULE}/api/auth/project/removeProjectDefaultTokenLimit`;
			await post(url, { [entityIdKey]: entityId });
			setDefaultUserLimit(null);
			defaultUserLimitRef.current = null;
			setDefaultUserLimitDraft(DEFAULT_LIMIT_DRAFT);
			await fetchMemberLimits();
			toast.success("Default user limits deleted");
		} catch (e) {
			console.error("Failed to remove default user limits", e);
			toast.error("Failed to remove default user limits");
		} finally {
			setSavingDefaultLimit(false);
		}
	};

	const confirmDeleteDefaultLimit = async () => {
		const confirmed = window.confirm(
			`Delete default user limits for this ${entityTypeLabel}? This will keep per-user overrides unchanged.`,
		);
		if (!confirmed) {
			return;
		}
		await removeDefaultUserLimit();
	};

	const upsertUserLimit = async (
		memberId: string,
		updates: Partial<ExceptionEntry>,
	) => {
		const member = members.find((m) => m.id === memberId);
		if (!member) {
			toast.error("Unable to find member to update");
			return;
		}

		const existing =
			userExceptions.find((e) => e.entityId === memberId) ??
			toExceptionEntry(member);
		const next: ExceptionEntry = {
			...existing,
			...updates,
		};

		setSavingExceptionIds((prev) => new Set(prev).add(memberId));
		try {
			const hasAnyLimit =
				next.combinedLimit > 0 ||
				next.inputLimit > 0 ||
				next.outputLimit > 0;
			await post(
				`${Env.MODULE}/api/auth/${entityPath}/${editUsersEndpoint}`,
				{
					[entityIdKey]: entityId,
					userpermissions: [
						{
							userid: member.id,
							permission: member.permission,
							type: member.type,
							usageRestriction: hasAnyLimit ? "token" : null,
							usageFrequency: hasAnyLimit ? next.period : null,
							maxTokens: hasAnyLimit ? next.combinedLimit : null,
							maxInputTokens: hasAnyLimit
								? next.inputLimit
								: null,
							maxOutputTokens: hasAnyLimit
								? next.outputLimit
								: null,
							maxResponseTime: null,
						},
					],
				},
			);
			await fetchMemberLimits();
			toast.success("User limit updated");
		} catch (e) {
			console.error("Failed to update user token limit", e);
			toast.error("Failed to update user limit");
		} finally {
			setSavingExceptionIds((prev) => {
				const nextSet = new Set(prev);
				nextSet.delete(memberId);
				return nextSet;
			});
		}
	};

	const clearUserLimit = async (memberId: string) => {
		await upsertUserLimit(memberId, {
			combinedLimit: 0,
			inputLimit: 0,
			outputLimit: 0,
			period: "DAY",
			isActive: true,
		});
	};

	const platformUsedPeriods = platformLimits.map((l) => l.period);
	const platformAvailPeriods = PERIODS.filter(
		(p) => !platformUsedPeriods.includes(p),
	);

	const addPlatformLimit = async () => {
		const maxTokens = parseInt(newMaxTokens, 10) || 0;
		const maxInputTokens = parseInt(newMaxInput, 10) || 0;
		const maxOutputTokens = parseInt(newMaxOutput, 10) || 0;
		const newId = `platform-${newPeriod}`;
		setSavingPlatformIds((prev) => new Set(prev).add(newId));
		try {
			await post(
				`${Env.MODULE}/api/auth/engine/setModelPlatformTokenLimit`,
				{
					engineId: entityId,
					usageFrequency: newPeriod,
					maxTokens,
					maxInputTokens,
					maxOutputTokens,
					maxResponseTime: -1,
					isActive: true,
				},
			);
			setShowPlatformAddDialog(false);
			await fetchPlatformLimits();
			toast.success("Platform model limit added");
		} catch (e) {
			console.error("Failed to add model platform limit", e);
			toast.error("Failed to add model platform limit");
		} finally {
			setSavingPlatformIds((prev) => {
				const next = new Set(prev);
				next.delete(newId);
				return next;
			});
		}
	};

	const isDirty = (l: TokenLimitEntry) =>
		l.period !== l._saved.period ||
		l.maxTokens !== l._saved.maxTokens ||
		l.maxInputTokens !== l._saved.maxInputTokens ||
		l.maxOutputTokens !== l._saved.maxOutputTokens ||
		l.isActive !== l._saved.isActive;

	const savePlatformLimit = async (limit: TokenLimitEntry) => {
		setSavingPlatformIds((prev) => new Set(prev).add(limit.id));
		try {
			await post(
				`${Env.MODULE}/api/auth/engine/setModelPlatformTokenLimit`,
				{
					engineId: entityId,
					usageFrequency: limit.period,
					maxTokens: limit.maxTokens,
					maxInputTokens: limit.maxInputTokens ?? 0,
					maxOutputTokens: limit.maxOutputTokens ?? 0,
					maxResponseTime: -1,
					isActive: limit.isActive,
				},
			);
			await fetchPlatformLimits();
			toast.success("Platform model limit saved");
		} catch (e) {
			console.error("Failed to save model platform limit", e);
			toast.error("Failed to save model platform limit");
		} finally {
			setSavingPlatformIds((prev) => {
				const next = new Set(prev);
				next.delete(limit.id);
				return next;
			});
		}
	};

	const updatePlatformLimit = (
		id: string,
		updates: Partial<TokenLimitEntry>,
	) => {
		setPlatformLimits((prev) =>
			prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
		);
	};

	const removePlatformLimit = async (period: TimePeriod) => {
		const id = `platform-${period}`;
		setSavingPlatformIds((prev) => new Set(prev).add(id));
		try {
			await post(
				`${Env.MODULE}/api/auth/engine/removeModelPlatformTokenLimit`,
				{
					engineId: entityId,
					usageFrequency: period,
				},
			);
			await fetchPlatformLimits();
			toast.success("Platform model limit removed");
		} catch (e) {
			console.error("Failed to remove model platform limit", e);
			toast.error("Failed to remove model platform limit");
		} finally {
			setSavingPlatformIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}
	};

	const memberOptions = useMemo(
		() =>
			members.map((member) => ({
				id: member.id,
				name: member.name || member.id,
				email: member.email || "",
				loginType: member.type || "",
			})),
		[members],
	);

	const defaultDirty =
		!defaultUserLimit ||
		defaultUserLimitDraft.period !== defaultUserLimit.period ||
		defaultUserLimitDraft.maxTokens !== defaultUserLimit.maxTokens ||
		(defaultUserLimitDraft.maxInputTokens ?? 0) !==
			(defaultUserLimit.maxInputTokens ?? 0) ||
		(defaultUserLimitDraft.maxOutputTokens ?? 0) !==
			(defaultUserLimit.maxOutputTokens ?? 0) ||
		defaultUserLimitDraft.isActive !== defaultUserLimit.isActive;

	if (loading) {
		return (
			<div className="flex w-full items-center justify-center py-12">
				<Spinner className="size-6" />
			</div>
		);
	}

	return (
		<div
			className="flex w-full flex-col gap-8"
			data-testid="token-limits-panel"
		>
			<div>
				<h2 className="font-semibold text-lg">
					Token Limits - {entityName}
				</h2>
				<p className="text-muted-foreground text-sm">
					{isModel
						? `Configure token limits for this ${entityTypeLabel} using platform-wide, default-user, and per-user controls.`
						: `Configure token limits for this ${entityTypeLabel} using default-user and per-user controls.`}
				</p>
			</div>

			{isModel && (
				<section>
					<div className="mb-3 flex items-center justify-between">
						<div>
							<h3 className="font-semibold text-base">
								Platform-Wide Limits
							</h3>
							<p className="text-muted-foreground text-sm">
								Total usage limits across all users for this
								model, by period.
							</p>
						</div>
						<Button
							onClick={() => {
								if (platformAvailPeriods.length === 0) return;
								setNewPeriod(platformAvailPeriods[0]);
								setNewMaxTokens("100000");
								setNewMaxInput("60000");
								setNewMaxOutput("40000");
								setShowPlatformAddDialog(true);
							}}
							disabled={platformAvailPeriods.length === 0}
							size="sm"
						>
							<Plus className="mr-1 size-3" /> Add Limit
						</Button>
					</div>
					<div className="flex flex-col gap-2">
						{platformLimits.map((limit) => {
							const usage = platformUsageByPeriod[limit.period];
							const isSaving = savingPlatformIds.has(limit.id);
							return (
								<EditableLimitRow
									key={limit.id}
									onDelete={() =>
										removePlatformLimit(limit.period)
									}
									onSave={() => savePlatformLimit(limit)}
									isDirty={isDirty(limit)}
								>
									<div className="flex items-center gap-2">
										<Label className="whitespace-nowrap text-xs">
											Combined:
										</Label>
										<Input
											type="number"
											value={limit.maxTokens}
											onChange={(e) =>
												updatePlatformLimit(limit.id, {
													maxTokens:
														parseInt(
															e.target.value,
															10,
														) || 0,
												})
											}
											disabled={isSaving}
											className="h-8 w-28"
										/>
										{usage && (
											<span className="text-muted-foreground text-xs">
												Used:{" "}
												{usage.tokensUsed.toLocaleString()}
											</span>
										)}
									</div>
									<div className="flex items-center gap-2">
										<Label className="whitespace-nowrap text-xs">
											Input:
										</Label>
										<Input
											type="number"
											value={limit.maxInputTokens ?? 0}
											onChange={(e) =>
												updatePlatformLimit(limit.id, {
													maxInputTokens:
														parseInt(
															e.target.value,
															10,
														) || 0,
												})
											}
											disabled={isSaving}
											className="h-8 w-28"
										/>
										{usage && (
											<span className="text-muted-foreground text-xs">
												Used:{" "}
												{usage.inputTokensUsed.toLocaleString()}
											</span>
										)}
									</div>
									<div className="flex items-center gap-2">
										<Label className="whitespace-nowrap text-xs">
											Output:
										</Label>
										<Input
											type="number"
											value={limit.maxOutputTokens ?? 0}
											onChange={(e) =>
												updatePlatformLimit(limit.id, {
													maxOutputTokens:
														parseInt(
															e.target.value,
															10,
														) || 0,
												})
											}
											disabled={isSaving}
											className="h-8 w-28"
										/>
										{usage && (
											<span className="text-muted-foreground text-xs">
												Used:{" "}
												{usage.outputTokensUsed.toLocaleString()}
											</span>
										)}
									</div>
									<div className="flex items-center gap-2">
										<Label className="text-xs">
											Period:
										</Label>
										<Select
											value={limit.period}
											onValueChange={(v: TimePeriod) =>
												updatePlatformLimit(limit.id, {
													period: v,
												})
											}
										>
											<SelectTrigger className="h-8 w-28">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{PERIODS.filter(
													(p) =>
														p === limit.period ||
														!platformUsedPeriods.includes(
															p,
														),
												).map((p) => (
													<SelectItem
														key={p}
														value={p}
													>
														{TIME_PERIOD_LABELS[p]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="flex items-center gap-2">
										<Label className="text-xs">
											Active:
										</Label>
										<Switch
											checked={limit.isActive}
											onCheckedChange={(v) =>
												updatePlatformLimit(limit.id, {
													isActive: v,
												})
											}
											disabled={isSaving}
										/>
									</div>
								</EditableLimitRow>
							);
						})}
						{platformLimits.length === 0 && (
							<p className="py-4 text-center text-muted-foreground text-sm">
								No platform model limits configured.
							</p>
						)}
					</div>

					<AddLimitDialog
						open={showPlatformAddDialog}
						onOpenChange={setShowPlatformAddDialog}
						onConfirm={addPlatformLimit}
					>
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-2">
								<Label className="w-20 text-sm">
									Combined:
								</Label>
								<Input
									type="number"
									value={newMaxTokens}
									onChange={(e) =>
										setNewMaxTokens(e.target.value)
									}
								/>
							</div>
							<div className="flex items-center gap-2">
								<Label className="w-20 text-sm">Input:</Label>
								<Input
									type="number"
									value={newMaxInput}
									onChange={(e) =>
										setNewMaxInput(e.target.value)
									}
								/>
							</div>
							<div className="flex items-center gap-2">
								<Label className="w-20 text-sm">Output:</Label>
								<Input
									type="number"
									value={newMaxOutput}
									onChange={(e) =>
										setNewMaxOutput(e.target.value)
									}
								/>
							</div>
							<div className="flex items-center gap-2">
								<Label className="w-20 text-sm">Period:</Label>
								<Select
									value={newPeriod}
									onValueChange={(v: TimePeriod) =>
										setNewPeriod(v)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{platformAvailPeriods.map((p) => (
											<SelectItem key={p} value={p}>
												{TIME_PERIOD_LABELS[p]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</AddLimitDialog>
				</section>
			)}

			<section>
				<div className="mb-3 flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-base">
							Default User Limits
						</h3>
						<p className="text-muted-foreground text-sm">
							Apply one default limit profile to all users for
							this {entityTypeLabel}.
						</p>
					</div>
				</div>
				<EditableLimitRow
					onDelete={confirmDeleteDefaultLimit}
					onSave={saveDefaultUserLimit}
					isDirty={defaultDirty}
				>
					<div className="flex items-center gap-2">
						<Label className="whitespace-nowrap text-xs">
							Combined:
						</Label>
						<Input
							type="number"
							value={defaultUserLimitDraft.maxTokens}
							onChange={(e) =>
								setDefaultUserLimitDraft((prev) => ({
									...prev,
									maxTokens:
										parseInt(e.target.value, 10) || 0,
								}))
							}
							disabled={savingDefaultLimit}
							className="h-8 w-28"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="whitespace-nowrap text-xs">
							Input:
						</Label>
						<Input
							type="number"
							value={defaultUserLimitDraft.maxInputTokens ?? 0}
							onChange={(e) =>
								setDefaultUserLimitDraft((prev) => ({
									...prev,
									maxInputTokens:
										parseInt(e.target.value, 10) || 0,
								}))
							}
							disabled={savingDefaultLimit}
							className="h-8 w-28"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="whitespace-nowrap text-xs">
							Output:
						</Label>
						<Input
							type="number"
							value={defaultUserLimitDraft.maxOutputTokens ?? 0}
							onChange={(e) =>
								setDefaultUserLimitDraft((prev) => ({
									...prev,
									maxOutputTokens:
										parseInt(e.target.value, 10) || 0,
								}))
							}
							disabled={savingDefaultLimit}
							className="h-8 w-28"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="text-xs">Period:</Label>
						<Select
							value={defaultUserLimitDraft.period}
							onValueChange={(v: TimePeriod) =>
								setDefaultUserLimitDraft((prev) => ({
									...prev,
									period: v,
								}))
							}
						>
							<SelectTrigger className="h-8 w-28">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PERIODS.map((p) => (
									<SelectItem key={p} value={p}>
										{TIME_PERIOD_LABELS[p]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-2">
						<Label className="text-xs">Active:</Label>
						<Switch
							checked={defaultUserLimitDraft.isActive}
							onCheckedChange={(v) =>
								setDefaultUserLimitDraft((prev) => ({
									...prev,
									isActive: v,
								}))
							}
							disabled={savingDefaultLimit}
						/>
					</div>
				</EditableLimitRow>
			</section>

			<section>
				<div className="mb-3">
					<h3 className="font-semibold text-base">Per-User Limits</h3>
					<p className="text-muted-foreground text-sm">
						Override default user limits for specific users on this{" "}
						{entityTypeLabel}.
					</p>
				</div>
				{savingExceptionIds.size > 0 && (
					<p className="mb-2 text-muted-foreground text-xs">
						Saving updates...
					</p>
				)}
				<ExceptionsSection
					exceptions={userExceptions}
					entityLabel="User"
					entityOptions={memberOptions}
					renderEntityDetails={(user) => (
						<EntityDetailRow
							primary={user.name}
							details={[
								{ label: "ID", value: user.id },
								{ label: "Email", value: String(user.email) },
								{
									label: "Login",
									value: String(user.loginType),
								},
							]}
						/>
					)}
					onAdd={(user) => {
						const baseCombined = defaultUserLimit
							? (defaultUserLimit.maxTokens ?? 0) + 1
							: 100000;
						const baseInput = defaultUserLimit
							? (defaultUserLimit.maxInputTokens ?? 0)
							: 60000;
						const baseOutput = defaultUserLimit
							? (defaultUserLimit.maxOutputTokens ?? 0)
							: 40000;
						const basePeriod = defaultUserLimit
							? defaultUserLimit.period
							: "DAY";
						upsertUserLimit(user.id, {
							entityId: user.id,
							entityName: user.name,
							entityDetails: [
								{ label: "ID", value: user.id },
								{ label: "Email", value: String(user.email) },
							],
							combinedLimit: baseCombined,
							inputLimit: baseInput,
							outputLimit: baseOutput,
							period: basePeriod,
							isActive: true,
						});
					}}
					onRemove={(id) => clearUserLimit(id)}
					onUpdate={(id, updates) => upsertUserLimit(id, updates)}
				/>
			</section>
		</div>
	);
}
