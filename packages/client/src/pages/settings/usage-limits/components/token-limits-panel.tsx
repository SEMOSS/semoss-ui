import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Switch,
} from "@semoss/ui/next";
import { TIME_PERIOD_LABELS, UI_TIME_PERIODS } from "../constants";
import type { TimePeriod, TokenLimitEntry } from "../types";
import { EditableLimitRow } from "./editable-limit-row";
import {
	type GroupedLimitEntity,
	type GroupedLimitRow,
	GroupedLimitsSection,
} from "./grouped-limits-section";
import {
	createDraftFromValues,
	DEFAULT_LIMIT_DRAFT,
	hasAnyTokenLimitValue,
	PERIODS,
	useTokenLimitsData,
} from "./use-token-limits-data";

interface TokenLimitsPanelProps {
	entityType: "MODEL" | "APP";
	entityId: string;
	entityName: string;
}

interface UserLimitOption {
	id: string;
	name: string;
	email: string;
	loginType: string;
}

interface TeamLimitOption {
	id: string;
	name: string;
	teamType: string;
	permission: string;
}

const buildRowId = (entityId: string, period: TimePeriod) =>
	`${entityId}::${period}`;

const isDirty = (limit: TokenLimitEntry) =>
	limit.period !== limit._saved.period ||
	limit.maxTokens !== limit._saved.maxTokens ||
	limit.maxInputTokens !== limit._saved.maxInputTokens ||
	limit.maxOutputTokens !== limit._saved.maxOutputTokens ||
	limit.maxResponseTime !== limit._saved.maxResponseTime ||
	limit.isActive !== limit._saved.isActive;

const sortRows = (rows: GroupedLimitRow[]) =>
	[...rows].sort(
		(a, b) => PERIODS.indexOf(a.period) - PERIODS.indexOf(b.period),
	);

const parseNullableNumber = (value: string) => {
	if (value.trim() === "") {
		return null;
	}
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? null : parsed;
};

const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, "");

const normalizeTokenLimitEntry = (limit: TokenLimitEntry): TokenLimitEntry => {
	if (limit.maxTokens != null) {
		return {
			...limit,
			maxInputTokens: null,
			maxOutputTokens: null,
		};
	}
	if (limit.maxInputTokens != null || limit.maxOutputTokens != null) {
		return {
			...limit,
			maxTokens: null,
		};
	}
	return limit;
};

type TokenLimitMode = "TOTAL" | "SPLIT";

const getTokenLimitMode = (limit: TokenLimitEntry): TokenLimitMode =>
	limit.maxInputTokens != null || limit.maxOutputTokens != null
		? "SPLIT"
		: "TOTAL";

const mergeDraftLimits = <T extends { id: string }>(
	limits: T[],
	drafts: Record<string, T>,
) => limits.map((limit) => drafts[limit.id] ?? limit);

const mergeGroupedEntities = <TOption,>(
	entities: GroupedLimitEntity<TOption>[],
	localRowsByEntityId: Record<string, GroupedLimitRow[]>,
	localEntityById: Record<string, Omit<GroupedLimitEntity<TOption>, "rows">>,
) =>
	Object.values(
		entities.reduce<Record<string, GroupedLimitEntity<TOption>>>(
			(acc, entity) => {
				const localRows = localRowsByEntityId[entity.id] ?? [];
				acc[entity.id] = {
					...entity,
					rows: sortRows([...entity.rows, ...localRows]),
				};
				return acc;
			},
			{},
		),
	)
		.concat(
			Object.entries(localRowsByEntityId)
				.filter(
					([entityId, rows]) =>
						rows.length > 0 &&
						!entities.some((entity) => entity.id === entityId),
				)
				.map(([entityId, rows]) => ({
					...(localEntityById[entityId] ?? {
						id: entityId,
						name: entityId,
						details: [],
					}),
					rows: sortRows(rows),
				})),
		)
		.sort((a, b) => a.name.localeCompare(b.name));

export function TokenLimitsPanel({
	entityType,
	entityId,
	entityName,
}: TokenLimitsPanelProps) {
	const isModel = entityType === "MODEL";
	const entityTypeLabel = entityType === "MODEL" ? "model" : "app";
	const {
		loading,
		members,
		teamGroups,
		userTokenLimits,
		teamTokenLimits,
		defaultUserLimits,
		defaultTeamLimits,
		platformLimits,
		platformUsageByPeriod,
		savingPlatformIds,
		savingDefaultLimit,
		savingDefaultTeamLimit,
		savingUserIds,
		savingTeamIds,
		memberOptions,
		teamOptions,
		saveDefaultUserLimit,
		removeDefaultUserLimit,
		saveDefaultTeamLimit,
		removeDefaultTeamLimit,
		savePlatformLimit,
		removePlatformLimit,
		saveUserLimitRow,
		removeUserLimitRow,
		saveTeamLimitRow,
		removeTeamLimitRow,
	} = useTokenLimitsData({ entityType, entityId });

	const [userSectionOpen, setUserSectionOpen] = useState(true);
	const [teamSectionOpen, setTeamSectionOpen] = useState(true);
	const [platformSectionOpen, setPlatformSectionOpen] = useState(true);
	const [newDefaultUserRow, setNewDefaultUserRow] =
		useState<TokenLimitEntry | null>(null);
	const [newDefaultTeamRow, setNewDefaultTeamRow] =
		useState<TokenLimitEntry | null>(null);
	const [newPlatformRow, setNewPlatformRow] =
		useState<TokenLimitEntry | null>(null);
	const [defaultUserDraftsById, setDefaultUserDraftsById] = useState<
		Record<string, TokenLimitEntry>
	>({});
	const [defaultTeamDraftsById, setDefaultTeamDraftsById] = useState<
		Record<string, TokenLimitEntry>
	>({});
	const [platformDraftsById, setPlatformDraftsById] = useState<
		Record<string, TokenLimitEntry>
	>({});
	const [localUserRowsById, setLocalUserRowsById] = useState<
		Record<string, GroupedLimitRow[]>
	>({});
	const [localTeamRowsById, setLocalTeamRowsById] = useState<
		Record<string, GroupedLimitRow[]>
	>({});
	const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null);

	const confirmDelete = () => {
		deleteAction?.();
		setDeleteAction(null);
	};

	const requestDelete = (action: () => void) => {
		setDeleteAction(() => action);
	};

	const defaultUserPeriods = useMemo(
		() => defaultUserLimits.map((limit) => limit.period),
		[defaultUserLimits],
	);
	const defaultTeamPeriods = useMemo(
		() => defaultTeamLimits.map((limit) => limit.period),
		[defaultTeamLimits],
	);

	const groupedUserLimits = useMemo<GroupedLimitEntity<UserLimitOption>[]>(
		() =>
			Array.from(
				userTokenLimits
					.reduce((map, limit) => {
						const member = members.find(
							(candidate) => candidate.id === limit.userId,
						);
						if (!member) {
							return map;
						}
						const period = PERIODS.includes(
							limit.usageFrequency?.toUpperCase() as TimePeriod,
						)
							? (limit.usageFrequency?.toUpperCase() as TimePeriod)
							: "DAY";
						const existing = map.get(limit.userId) ?? {
							id: limit.userId,
							name: member.name || limit.userId,
							details: [
								{ label: "ID", value: limit.userId },
								{
									label: "Email",
									value: member.email || "N/A",
								},
								{ label: "Login", value: member.type || "N/A" },
							],
							rows: [] as GroupedLimitRow[],
							option: memberOptions.find(
								(option) => option.id === limit.userId,
							),
						};

						const values = {
							maxTokens:
								limit.maxTokens != null && limit.maxTokens >= 0
									? limit.maxTokens
									: null,
							maxInputTokens:
								limit.maxInputTokens != null &&
								limit.maxInputTokens >= 0
									? limit.maxInputTokens
									: null,
							maxOutputTokens:
								limit.maxOutputTokens != null &&
								limit.maxOutputTokens >= 0
									? limit.maxOutputTokens
									: null,
							maxResponseTime:
								limit.maxResponseTime != null &&
								limit.maxResponseTime >= 0
									? limit.maxResponseTime
									: null,
						};
						const hasAny = hasAnyTokenLimitValue(values);
						if (hasAny) {
							existing.rows.push({
								id: buildRowId(limit.userId, period),
								period,
								savedPeriod: period,
								combinedLimit: values.maxTokens,
								inputLimit: values.maxInputTokens,
								outputLimit: values.maxOutputTokens,
								responseTimeLimit: values.maxResponseTime,
								isActive: limit.isActive !== false,
							});
						}
						map.set(limit.userId, existing);
						return map;
					}, new Map<string, GroupedLimitEntity<UserLimitOption>>())
					.values(),
			)
				.map((entry) => ({
					...entry,
					rows: sortRows(entry.rows),
				}))
				.filter((entry) => entry.rows.length > 0)
				.sort((a, b) => a.name.localeCompare(b.name)),
		[members, memberOptions, userTokenLimits],
	);

	const groupedTeamLimits = useMemo<GroupedLimitEntity<TeamLimitOption>[]>(
		() =>
			Array.from(
				teamTokenLimits
					.reduce((map, limit) => {
						const team = teamGroups.find(
							(candidate) =>
								candidate.ID === limit.groupId &&
								candidate.TYPE === limit.groupType,
						);
						if (!team) {
							return map;
						}
						const period = PERIODS.includes(
							limit.usageFrequency?.toUpperCase() as TimePeriod,
						)
							? (limit.usageFrequency?.toUpperCase() as TimePeriod)
							: "DAY";
						const existing = map.get(limit.groupId) ?? {
							id: limit.groupId,
							name: limit.groupId,
							details: [
								{ label: "Type", value: team.TYPE || "N/A" },
								{
									label: "Permission",
									value: String(team.PERMISSION),
								},
							],
							rows: [] as GroupedLimitRow[],
							option: teamOptions.find(
								(option) => option.id === limit.groupId,
							),
						};

						const values = {
							maxTokens:
								limit.maxTokens != null && limit.maxTokens >= 0
									? limit.maxTokens
									: null,
							maxInputTokens:
								limit.maxInputTokens != null &&
								limit.maxInputTokens >= 0
									? limit.maxInputTokens
									: null,
							maxOutputTokens:
								limit.maxOutputTokens != null &&
								limit.maxOutputTokens >= 0
									? limit.maxOutputTokens
									: null,
							maxResponseTime:
								limit.maxResponseTime != null &&
								limit.maxResponseTime >= 0
									? limit.maxResponseTime
									: null,
						};
						const hasAny = hasAnyTokenLimitValue(values);
						if (hasAny) {
							existing.rows.push({
								id: buildRowId(limit.groupId, period),
								period,
								savedPeriod: period,
								combinedLimit: values.maxTokens,
								inputLimit: values.maxInputTokens,
								outputLimit: values.maxOutputTokens,
								responseTimeLimit: values.maxResponseTime,
								isActive: limit.isActive !== false,
							});
						}
						map.set(limit.groupId, existing);
						return map;
					}, new Map<string, GroupedLimitEntity<TeamLimitOption>>())
					.values(),
			)
				.map((entry) => ({
					...entry,
					rows: sortRows(entry.rows),
				}))
				.filter((entry) => entry.rows.length > 0)
				.sort((a, b) => a.name.localeCompare(b.name)),
		[teamGroups, teamOptions, teamTokenLimits],
	);
	const remainingDefaultUserPeriods = useMemo(
		() =>
			UI_TIME_PERIODS.filter(
				(period) => !defaultUserPeriods.includes(period),
			),
		[defaultUserPeriods],
	);
	const remainingDefaultTeamPeriods = useMemo(
		() =>
			UI_TIME_PERIODS.filter(
				(period) => !defaultTeamPeriods.includes(period),
			),
		[defaultTeamPeriods],
	);
	const remainingPlatformPeriods = useMemo(
		() =>
			UI_TIME_PERIODS.filter(
				(period) =>
					!platformLimits.some((row) => row.period === period),
			),
		[platformLimits],
	);

	useEffect(() => {
		setDefaultUserDraftsById((prev) =>
			Object.fromEntries(
				Object.entries(prev).filter(([id]) =>
					defaultUserLimits.some((limit) => limit.id === id),
				),
			),
		);
	}, [defaultUserLimits]);

	useEffect(() => {
		setDefaultTeamDraftsById((prev) =>
			Object.fromEntries(
				Object.entries(prev).filter(([id]) =>
					defaultTeamLimits.some((limit) => limit.id === id),
				),
			),
		);
	}, [defaultTeamLimits]);

	useEffect(() => {
		setPlatformDraftsById((prev) =>
			Object.fromEntries(
				Object.entries(prev).filter(([id]) =>
					platformLimits.some((limit) => limit.id === id),
				),
			),
		);
	}, [platformLimits]);

	const displayedDefaultUserLimits = useMemo(
		() => mergeDraftLimits(defaultUserLimits, defaultUserDraftsById),
		[defaultUserDraftsById, defaultUserLimits],
	);
	const displayedDefaultTeamLimits = useMemo(
		() => mergeDraftLimits(defaultTeamLimits, defaultTeamDraftsById),
		[defaultTeamDraftsById, defaultTeamLimits],
	);
	const displayedPlatformLimits = useMemo(
		() => mergeDraftLimits(platformLimits, platformDraftsById),
		[platformDraftsById, platformLimits],
	);

	const localUserEntityById = useMemo(
		() =>
			Object.fromEntries(
				memberOptions.map((member) => [
					member.id,
					{
						id: member.id,
						name: member.name || member.id,
						details: [
							{ label: "ID", value: member.id },
							{ label: "Email", value: member.email || "N/A" },
							{
								label: "Login",
								value: member.loginType || "N/A",
							},
						],
						option: member,
					},
				]),
			),
		[memberOptions],
	);
	const localTeamEntityById = useMemo(
		() =>
			Object.fromEntries(
				teamOptions.map((team) => [
					team.id,
					{
						id: team.id,
						name: team.name || team.id,
						details: [
							{ label: "Type", value: team.teamType || "N/A" },
							{
								label: "Permission",
								value: team.permission || "N/A",
							},
						],
						option: team,
					},
				]),
			),
		[teamOptions],
	);

	const displayedGroupedUserLimits = useMemo(
		() =>
			mergeGroupedEntities(
				groupedUserLimits,
				localUserRowsById,
				localUserEntityById,
			),
		[groupedUserLimits, localUserEntityById, localUserRowsById],
	);
	const displayedGroupedTeamLimits = useMemo(
		() =>
			mergeGroupedEntities(
				groupedTeamLimits,
				localTeamRowsById,
				localTeamEntityById,
			),
		[groupedTeamLimits, localTeamEntityById, localTeamRowsById],
	);
	const userRowsById = useMemo(
		() =>
			new Map(
				displayedGroupedUserLimits.map((group) => [
					group.id,
					group.rows,
				]),
			),
		[displayedGroupedUserLimits],
	);
	const teamRowsById = useMemo(
		() =>
			new Map(
				displayedGroupedTeamLimits.map((group) => [
					group.id,
					group.rows,
				]),
			),
		[displayedGroupedTeamLimits],
	);
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
						? `Configure token and compute-time limits for this ${entityTypeLabel} using platform-wide, default-user, per-user, default-team, and per-team controls.`
						: `Configure token and compute-time limits for this ${entityTypeLabel} using default-user, per-user, default-team, and per-team controls.`}
				</p>
			</div>

			{isModel && (
				<section className="rounded-xl border">
					<Collapsible
						open={platformSectionOpen}
						onOpenChange={setPlatformSectionOpen}
					>
						<div className="border-b px-4 py-3">
							<div className="flex items-start justify-between gap-3">
								<CollapsibleTrigger asChild>
									<button
										type="button"
										className="flex flex-1 items-start gap-2 text-left"
									>
										{platformSectionOpen ? (
											<ChevronDown className="mt-0.5 size-4" />
										) : (
											<ChevronRight className="mt-0.5 size-4" />
										)}
										<div>
											<h3 className="font-semibold text-base">
												Platform-Wide Limits
											</h3>
											<p className="text-muted-foreground text-sm">
												Total token or compute-time
												usage across all users for this
												model, by period.
											</p>
										</div>
									</button>
								</CollapsibleTrigger>
								<Button
									size="sm"
									onClick={() => {
										const nextPeriod =
											remainingPlatformPeriods[0];
										if (!nextPeriod) {
											return;
										}
										setNewPlatformRow(
											createDraftFromValues(
												{
													period: nextPeriod,
													maxTokens: null,
													maxInputTokens: null,
													maxOutputTokens: null,
													maxResponseTime: null,
													isActive: true,
												},
												"platform-new",
											),
										);
									}}
									disabled={
										!!newPlatformRow ||
										remainingPlatformPeriods.length === 0
									}
								>
									<Plus className="mr-1 size-3" /> Add Limit
								</Button>
							</div>
						</div>
						<CollapsibleContent className="px-4 py-4">
							<div className="flex flex-col gap-2">
								{newPlatformRow && (
									<EditableLimitRow
										onDelete={() => setNewPlatformRow(null)}
										onSave={async () => {
											const success =
												await savePlatformLimit(
													newPlatformRow,
												);
											if (success) {
												setNewPlatformRow(null);
											}
											return success;
										}}
										isDirty
									>
										<PlatformRowFields
											limit={newPlatformRow}
											onChange={setNewPlatformRow}
										/>
									</EditableLimitRow>
								)}
								{displayedPlatformLimits.map((limit) => {
									const usage =
										platformUsageByPeriod[limit.period];
									const isSaving = savingPlatformIds.has(
										limit.id,
									);
									return (
										<PlatformLimitEditorRow
											key={limit.id}
											limit={limit}
											sourceLimit={
												platformLimits.find(
													(source) =>
														source.id === limit.id,
												) ?? limit
											}
											usage={usage}
											usedPeriods={displayedPlatformLimits.map(
												(row) => row.period,
											)}
											disabled={isSaving}
											onChange={(next) =>
												setPlatformDraftsById(
													(prev) => ({
														...prev,
														[limit.id]: next,
													}),
												)
											}
											onDelete={() =>
												requestDelete(() =>
													removePlatformLimit(
														(
															platformLimits.find(
																(source) =>
																	source.id ===
																	limit.id,
															) ?? limit
														).period,
													),
												)
											}
											onSave={async (next) => {
												const success =
													await savePlatformLimit(
														next,
													);
												if (success) {
													setPlatformDraftsById(
														(prev) => {
															const {
																[limit.id]:
																	_removed,
																...rest
															} = prev;
															return rest;
														},
													);
												}
												return success;
											}}
										/>
									);
								})}
								{displayedPlatformLimits.length === 0 &&
									!newPlatformRow && (
										<p className="py-4 text-center text-muted-foreground text-sm">
											No platform model limits configured.
										</p>
									)}
							</div>
						</CollapsibleContent>
					</Collapsible>
				</section>
			)}

			<DefaultLimitsSection
				title="Default User Limits"
				description={`Apply default token or compute-time limits for users on this ${entityTypeLabel}, one row per time period.`}
				open={userSectionOpen}
				onOpenChange={setUserSectionOpen}
				limits={displayedDefaultUserLimits}
				newLimit={newDefaultUserRow}
				setNewLimit={setNewDefaultUserRow}
				remainingPeriods={remainingDefaultUserPeriods}
				onCreateLimit={(period) =>
					createDraftFromValues(
						{
							period,
							maxTokens: DEFAULT_LIMIT_DRAFT._saved.maxTokens,
							maxInputTokens:
								DEFAULT_LIMIT_DRAFT._saved.maxInputTokens,
							maxOutputTokens:
								DEFAULT_LIMIT_DRAFT._saved.maxOutputTokens,
							maxResponseTime:
								DEFAULT_LIMIT_DRAFT._saved.maxResponseTime,
							isActive: DEFAULT_LIMIT_DRAFT._saved.isActive,
						},
						`default-user-limit-${period}`,
					)
				}
				onSaveLimit={saveDefaultUserLimit}
				onDeleteLimit={(period) =>
					requestDelete(() => removeDefaultUserLimit(period))
				}
				onChangeLimit={(id, next) =>
					setDefaultUserDraftsById((prev) => ({
						...prev,
						[id]: next,
					}))
				}
				onClearDraft={(id) =>
					setDefaultUserDraftsById((prev) => {
						const { [id]: _removed, ...rest } = prev;
						return rest;
					})
				}
				sourceLimits={defaultUserLimits}
				isSaving={savingDefaultLimit}
				emptyMessage="No default user limits configured."
			/>

			<GroupedLimitsSection
				title="Per-User Limits"
				description={`Group and manage per-user limits for this ${entityTypeLabel}.`}
				entityLabel="User"
				entities={displayedGroupedUserLimits}
				entityOptions={memberOptions.filter((option) => {
					const existingRows = userRowsById.get(option.id) ?? [];
					return existingRows.length < UI_TIME_PERIODS.length;
				})}
				emptyMessage="No per-user limits configured."
				multiPeriod
				savingIds={savingUserIds}
				supportsActive
				renderEntityDetails={(user) => (
					<div>
						<div className="font-medium text-sm">{user.name}</div>
						<div className="text-muted-foreground text-xs">
							{user.email || "N/A"} · {user.loginType || "N/A"}
						</div>
					</div>
				)}
				onAddEntity={(user) => {
					const existingRows = userRowsById.get(user.id) ?? [];
					const nextPeriod =
						UI_TIME_PERIODS.find(
							(period) =>
								!existingRows.some(
									(row) => row.period === period,
								),
						) ?? "DAY";
					setLocalUserRowsById((prev) => ({
						...prev,
						[user.id]: sortRows([
							...(prev[user.id] ?? []),
							{
								id: buildRowId(user.id, nextPeriod),
								period: nextPeriod,
								combinedLimit: null,
								inputLimit: null,
								outputLimit: null,
								responseTimeLimit: null,
								isActive: true,
							},
						]),
					}));
				}}
				onSaveSingleRow={async (entityUserId, row) => {
					const success = await saveUserLimitRow(entityUserId, {
						combinedLimit: row.combinedLimit,
						inputLimit: row.inputLimit,
						outputLimit: row.outputLimit,
						responseTimeLimit: row.responseTimeLimit,
						period: row.period,
						savedPeriod: row.savedPeriod,
						isActive: row.isActive,
					});
					if (success) {
						setLocalUserRowsById((prev) => ({
							...prev,
							[entityUserId]: (prev[entityUserId] ?? []).filter(
								(existing) => existing.id !== row.id,
							),
						}));
					}
				}}
				onRemoveEntityRow={(entityUserId, rowId) => {
					const localRow = (
						localUserRowsById[entityUserId] ?? []
					).find((row) => row.id === rowId);
					if (localRow) {
						setLocalUserRowsById((prev) => ({
							...prev,
							[entityUserId]: (prev[entityUserId] ?? []).filter(
								(row) => row.id !== rowId,
							),
						}));
						return;
					}
					const row = (userRowsById.get(entityUserId) ?? []).find(
						(existing) => existing.id === rowId,
					);
					if (!row) {
						return;
					}
					requestDelete(() =>
						removeUserLimitRow(
							entityUserId,
							row.savedPeriod ?? row.period,
						),
					);
				}}
			/>

			<DefaultLimitsSection
				title="Default Team Limits"
				description={`Apply default token or compute-time limits for teams on this ${entityTypeLabel}, one row per time period.`}
				open={teamSectionOpen}
				onOpenChange={setTeamSectionOpen}
				limits={displayedDefaultTeamLimits}
				newLimit={newDefaultTeamRow}
				setNewLimit={setNewDefaultTeamRow}
				remainingPeriods={remainingDefaultTeamPeriods}
				onCreateLimit={(period) =>
					createDraftFromValues(
						{
							period,
							maxTokens: DEFAULT_LIMIT_DRAFT._saved.maxTokens,
							maxInputTokens:
								DEFAULT_LIMIT_DRAFT._saved.maxInputTokens,
							maxOutputTokens:
								DEFAULT_LIMIT_DRAFT._saved.maxOutputTokens,
							maxResponseTime:
								DEFAULT_LIMIT_DRAFT._saved.maxResponseTime,
							isActive: DEFAULT_LIMIT_DRAFT._saved.isActive,
						},
						`default-team-limit-${period}`,
					)
				}
				onSaveLimit={saveDefaultTeamLimit}
				onDeleteLimit={(period) =>
					requestDelete(() => removeDefaultTeamLimit(period))
				}
				onChangeLimit={(id, next) =>
					setDefaultTeamDraftsById((prev) => ({
						...prev,
						[id]: next,
					}))
				}
				onClearDraft={(id) =>
					setDefaultTeamDraftsById((prev) => {
						const { [id]: _removed, ...rest } = prev;
						return rest;
					})
				}
				sourceLimits={defaultTeamLimits}
				isSaving={savingDefaultTeamLimit}
				emptyMessage="No default team limits configured."
			/>

			<GroupedLimitsSection
				title="Per-Team Limits"
				description={`Group and manage per-team limits for this ${entityTypeLabel}.`}
				entityLabel="Team"
				entities={displayedGroupedTeamLimits}
				entityOptions={teamOptions.filter((option) => {
					const existingRows = teamRowsById.get(option.id) ?? [];
					return existingRows.length < UI_TIME_PERIODS.length;
				})}
				emptyMessage="No per-team limits configured."
				multiPeriod
				savingIds={savingTeamIds}
				supportsActive
				renderEntityDetails={(team) => (
					<div>
						<div className="font-medium text-sm">{team.name}</div>
						<div className="text-muted-foreground text-xs">
							{team.teamType || "N/A"} ·{" "}
							{team.permission || "N/A"}
						</div>
					</div>
				)}
				onAddEntity={(team) => {
					const existingRows = teamRowsById.get(team.id) ?? [];
					const nextPeriod =
						UI_TIME_PERIODS.find(
							(period) =>
								!existingRows.some(
									(row) => row.period === period,
								),
						) ?? "DAY";
					setLocalTeamRowsById((prev) => ({
						...prev,
						[team.id]: sortRows([
							...(prev[team.id] ?? []),
							{
								id: buildRowId(team.id, nextPeriod),
								period: nextPeriod,
								combinedLimit: null,
								inputLimit: null,
								outputLimit: null,
								responseTimeLimit: null,
								isActive: true,
							},
						]),
					}));
				}}
				onSaveSingleRow={async (teamId, row) => {
					const success = await saveTeamLimitRow(teamId, {
						combinedLimit: row.combinedLimit,
						inputLimit: row.inputLimit,
						outputLimit: row.outputLimit,
						responseTimeLimit: row.responseTimeLimit,
						period: row.period,
						savedPeriod: row.savedPeriod,
						isActive: row.isActive,
					});
					if (success) {
						setLocalTeamRowsById((prev) => ({
							...prev,
							[teamId]: (prev[teamId] ?? []).filter(
								(existing) => existing.id !== row.id,
							),
						}));
					}
				}}
				onRemoveEntityRow={(teamId, rowId) => {
					const localRow = (localTeamRowsById[teamId] ?? []).find(
						(row) => row.id === rowId,
					);
					if (localRow) {
						setLocalTeamRowsById((prev) => ({
							...prev,
							[teamId]: (prev[teamId] ?? []).filter(
								(row) => row.id !== rowId,
							),
						}));
						return;
					}
					const row = (teamRowsById.get(teamId) ?? []).find(
						(existing) => existing.id === rowId,
					);
					if (!row) {
						return;
					}
					requestDelete(() =>
						removeTeamLimitRow(
							teamId,
							row.savedPeriod ?? row.period,
						),
					);
				}}
			/>

			<Dialog
				open={deleteAction !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteAction(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Usage Limit</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this usage limit?
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteAction(null)}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

const DefaultLimitsSection = ({
	title,
	description,
	open,
	onOpenChange,
	limits,
	newLimit,
	setNewLimit,
	remainingPeriods,
	onCreateLimit,
	onSaveLimit,
	onDeleteLimit,
	onChangeLimit,
	onClearDraft,
	sourceLimits,
	isSaving,
	emptyMessage,
}: {
	title: string;
	description: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	limits: TokenLimitEntry[];
	newLimit: TokenLimitEntry | null;
	setNewLimit: (next: TokenLimitEntry | null) => void;
	remainingPeriods: TimePeriod[];
	onCreateLimit: (period: TimePeriod) => TokenLimitEntry;
	onSaveLimit: (limit: TokenLimitEntry) => Promise<boolean>;
	onDeleteLimit: (period: TimePeriod) => void;
	onChangeLimit: (id: string, next: TokenLimitEntry) => void;
	onClearDraft: (id: string) => void;
	sourceLimits: TokenLimitEntry[];
	isSaving: boolean;
	emptyMessage: string;
}) => (
	<section className="rounded-xl border">
		<Collapsible open={open} onOpenChange={onOpenChange}>
			<div className="border-b px-4 py-3">
				<div className="flex items-start justify-between gap-3">
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className="flex flex-1 items-start gap-2 text-left"
						>
							{open ? (
								<ChevronDown className="mt-0.5 size-4" />
							) : (
								<ChevronRight className="mt-0.5 size-4" />
							)}
							<div>
								<h3 className="font-semibold text-base">
									{title}
								</h3>
								<p className="text-muted-foreground text-sm">
									{description}
								</p>
							</div>
						</button>
					</CollapsibleTrigger>
					<Button
						size="sm"
						onClick={() => {
							const nextPeriod = remainingPeriods[0];
							if (!nextPeriod) {
								return;
							}
							setNewLimit(onCreateLimit(nextPeriod));
						}}
						disabled={!remainingPeriods.length || !!newLimit}
					>
						<Plus className="mr-1 size-3" /> Add Limit
					</Button>
				</div>
			</div>
			<CollapsibleContent className="px-4 py-4">
				{newLimit || limits.length > 0 ? (
					<div className="flex flex-col gap-2">
						{newLimit && (
							<DefaultLimitEditorRow
								limit={newLimit}
								sourceLimit={newLimit}
								usedPeriods={limits.map(
									(limit) => limit.period,
								)}
								disabled={isSaving}
								onChange={setNewLimit}
								onSave={async (draft) => {
									const success = await onSaveLimit(draft);
									if (success) {
										setNewLimit(null);
									}
									return success;
								}}
								onDelete={() => setNewLimit(null)}
							/>
						)}
						{limits.map((limit) => (
							<DefaultLimitEditorRow
								key={limit.id}
								limit={limit}
								sourceLimit={
									sourceLimits.find(
										(source) => source.id === limit.id,
									) ?? limit
								}
								usedPeriods={limits.map((row) => row.period)}
								disabled={isSaving}
								onChange={(next) =>
									onChangeLimit(limit.id, next)
								}
								onSave={async (next) => {
									const success = await onSaveLimit(next);
									if (success) {
										onClearDraft(limit.id);
									}
									return success;
								}}
								onDelete={() =>
									onDeleteLimit(
										(
											sourceLimits.find(
												(source) =>
													source.id === limit.id,
											) ?? limit
										).period,
									)
								}
							/>
						))}
					</div>
				) : (
					<p className="py-4 text-center text-muted-foreground text-sm">
						{emptyMessage}
					</p>
				)}
			</CollapsibleContent>
		</Collapsible>
	</section>
);

const LimitFields = ({
	limit,
	onChange,
	disabled,
	availablePeriods = UI_TIME_PERIODS,
}: {
	limit: TokenLimitEntry;
	onChange: (next: TokenLimitEntry) => void;
	disabled?: boolean;
	availablePeriods?: TimePeriod[];
}) => {
	const [tokenLimitMode, setTokenLimitMode] = useState<TokenLimitMode>(
		getTokenLimitMode(limit),
	);

	useEffect(() => {
		if (
			limit.maxTokens != null ||
			limit.maxInputTokens != null ||
			limit.maxOutputTokens != null
		) {
			setTokenLimitMode(
				limit.maxInputTokens != null || limit.maxOutputTokens != null
					? "SPLIT"
					: "TOTAL",
			);
		}
	}, [limit.maxTokens, limit.maxInputTokens, limit.maxOutputTokens]);

	const updateNumber = (
		key:
			| "maxTokens"
			| "maxInputTokens"
			| "maxOutputTokens"
			| "maxResponseTime",
		value: string,
	) => {
		onChange(
			normalizeTokenLimitEntry({
				...limit,
				[key]: parseNullableNumber(sanitizeNumericInput(value)),
			}),
		);
	};

	return (
		<>
			<div className="flex items-center gap-2">
				<Label className="text-xs">Tokens:</Label>
				<Select
					value={tokenLimitMode}
					onValueChange={(value: TokenLimitMode) => {
						setTokenLimitMode(value);
						if (value === "TOTAL") {
							onChange({
								...limit,
								maxInputTokens: null,
								maxOutputTokens: null,
							});
							return;
						}
						onChange({
							...limit,
							maxTokens: null,
						});
					}}
				>
					<SelectTrigger className="h-8 w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="TOTAL">Total Tokens</SelectItem>
						<SelectItem value="SPLIT">Input + Output</SelectItem>
					</SelectContent>
				</Select>
			</div>
			{tokenLimitMode === "TOTAL" ? (
				<div className="flex items-center gap-2">
					<Label className="whitespace-nowrap text-xs">
						Total Tokens:
					</Label>
					<Input
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						value={limit.maxTokens ?? ""}
						onChange={(e) =>
							updateNumber("maxTokens", e.target.value)
						}
						disabled={disabled}
						className="h-8 w-28"
					/>
				</div>
			) : (
				<>
					<div className="flex items-center gap-2">
						<Label className="whitespace-nowrap text-xs">
							Input:
						</Label>
						<Input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={limit.maxInputTokens ?? ""}
							onChange={(e) =>
								updateNumber("maxInputTokens", e.target.value)
							}
							disabled={disabled}
							className="h-8 w-28"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="whitespace-nowrap text-xs">
							Output:
						</Label>
						<Input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={limit.maxOutputTokens ?? ""}
							onChange={(e) =>
								updateNumber("maxOutputTokens", e.target.value)
							}
							disabled={disabled}
							className="h-8 w-28"
						/>
					</div>
				</>
			)}
			<div className="flex items-center gap-2">
				<Label className="whitespace-nowrap text-xs">
					Compute Time (ms):
				</Label>
				<Input
					type="text"
					inputMode="numeric"
					pattern="[0-9]*"
					value={limit.maxResponseTime ?? ""}
					onChange={(e) =>
						updateNumber("maxResponseTime", e.target.value)
					}
					disabled={disabled}
					className="h-8 w-32"
				/>
			</div>
			<div className="flex items-center gap-2">
				<Label className="text-xs">Period:</Label>
				<Select
					value={limit.period}
					onValueChange={(value: TimePeriod) =>
						onChange({
							...limit,
							period: value,
						})
					}
				>
					<SelectTrigger className="h-8 w-28">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{availablePeriods.map((period) => (
							<SelectItem key={period} value={period}>
								{TIME_PERIOD_LABELS[period]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex items-center gap-2">
				<Label className="text-xs">Active:</Label>
				<Switch
					checked={limit.isActive}
					onCheckedChange={(checked) =>
						onChange({
							...limit,
							isActive: checked,
						})
					}
					disabled={disabled}
				/>
			</div>
		</>
	);
};

const PlatformRowFields = ({
	limit,
	onChange,
	disabled,
	usage,
	usedPeriods,
}: {
	limit: TokenLimitEntry;
	onChange: (next: TokenLimitEntry) => void;
	disabled?: boolean;
	usage?: {
		tokensUsed: number;
		inputTokensUsed: number;
		outputTokensUsed: number;
		computeTimeUsed: number;
	};
	usedPeriods?: TimePeriod[];
}) => (
	<>
		<LimitFields
			limit={limit}
			onChange={onChange}
			disabled={disabled}
			availablePeriods={UI_TIME_PERIODS.filter(
				(period) =>
					period === limit.period || !usedPeriods?.includes(period),
			)}
		/>
		{usage && (
			<div className="flex flex-col gap-1 text-muted-foreground text-xs">
				<div>Used combined: {usage.tokensUsed.toLocaleString()}</div>
				<div>Used input: {usage.inputTokensUsed.toLocaleString()}</div>
				<div>
					Used output: {usage.outputTokensUsed.toLocaleString()}
				</div>
				<div>
					Used response time: {usage.computeTimeUsed.toLocaleString()}{" "}
					ms
				</div>
			</div>
		)}
	</>
);

const PlatformLimitEditorRow = ({
	limit,
	sourceLimit,
	usage,
	usedPeriods,
	disabled,
	onChange,
	onDelete,
	onSave,
}: {
	limit: TokenLimitEntry;
	sourceLimit: TokenLimitEntry;
	usage?: {
		tokensUsed: number;
		inputTokensUsed: number;
		outputTokensUsed: number;
		computeTimeUsed: number;
	};
	usedPeriods: TimePeriod[];
	disabled?: boolean;
	onChange: (limit: TokenLimitEntry) => void;
	onDelete: () => void;
	onSave: (limit: TokenLimitEntry) => Promise<boolean>;
}) => (
	<EditableLimitRow
		onDelete={onDelete}
		onSave={() => {
			void onSave(limit);
		}}
		isDirty={isDirty(limit) || limit.period !== sourceLimit.period}
	>
		<PlatformRowFields
			limit={limit}
			onChange={onChange}
			disabled={disabled}
			usage={usage}
			usedPeriods={usedPeriods}
		/>
	</EditableLimitRow>
);

const DefaultLimitEditorRow = ({
	limit,
	sourceLimit,
	usedPeriods,
	disabled,
	onChange,
	onDelete,
	onSave,
}: {
	limit: TokenLimitEntry;
	sourceLimit: TokenLimitEntry;
	usedPeriods: TimePeriod[];
	disabled?: boolean;
	onChange: (limit: TokenLimitEntry) => void;
	onDelete: () => void;
	onSave: (limit: TokenLimitEntry) => Promise<boolean>;
}) => (
	<EditableLimitRow
		onDelete={onDelete}
		onSave={() => {
			void onSave(limit);
		}}
		isDirty={isDirty(limit) || limit.period !== sourceLimit.period}
	>
		<LimitFields
			limit={limit}
			onChange={onChange}
			disabled={disabled}
			availablePeriods={PERIODS.filter(
				(period) =>
					period === limit.period || !usedPeriods.includes(period),
			)}
		/>
	</EditableLimitRow>
);
