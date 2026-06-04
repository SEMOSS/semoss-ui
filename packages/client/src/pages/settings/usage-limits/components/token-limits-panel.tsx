import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
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

const buildRowId = (entityId: string, period: TimePeriod) =>
	`${entityId}::${period}`;

const isDirty = (limit: TokenLimitEntry) =>
	limit.period !== limit._saved.period ||
	limit.maxTokens !== limit._saved.maxTokens ||
	limit.maxInputTokens !== limit._saved.maxInputTokens ||
	limit.maxOutputTokens !== limit._saved.maxOutputTokens ||
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

const mergeDraftLimits = (
	limits: TokenLimitEntry[],
	drafts: Record<string, TokenLimitEntry>,
) => limits.map((limit) => drafts[limit.id] ?? limit);

const mergeGroupedEntities = (
	entities: GroupedLimitEntity[],
	localRowsByEntityId: Record<string, GroupedLimitRow[]>,
	localEntityById: Record<string, Omit<GroupedLimitEntity, "rows">>,
) =>
	Object.values(
		entities.reduce<Record<string, GroupedLimitEntity>>((acc, entity) => {
			const localRows = localRowsByEntityId[entity.id] ?? [];
			acc[entity.id] = {
				...entity,
				rows: sortRows([...entity.rows, ...localRows]),
			};
			return acc;
		}, {}),
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
		defaultUserLimits,
		defaultTeamLimits,
		platformLimits,
		platformUsageByPeriod,
		savingPlatformIds,
		savingDefaultLimit,
		savingDefaultTeamLimit,
		savingUserIds,
		savingTeamIds,
		getMemberLimitValues,
		getTeamLimitValues,
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

	const defaultUserPeriods = useMemo(
		() => defaultUserLimits.map((limit) => limit.period),
		[defaultUserLimits],
	);
	const defaultTeamPeriods = useMemo(
		() => defaultTeamLimits.map((limit) => limit.period),
		[defaultTeamLimits],
	);

	const groupedUserLimits = useMemo<GroupedLimitEntity[]>(
		() =>
			Array.from(
				members
					.reduce((map, member) => {
						const existing = map.get(member.id) ?? {
							id: member.id,
							name: member.name || member.id,
							details: [
								{ label: "ID", value: member.id },
								{
									label: "Email",
									value: member.email || "N/A",
								},
								{ label: "Login", value: member.type || "N/A" },
							],
							rows: [] as GroupedLimitRow[],
							option: memberOptions.find(
								(option) => option.id === member.id,
							),
						};

						const values = getMemberLimitValues(member);
						const hasAny = hasAnyTokenLimitValue(values);
						if (hasAny) {
							existing.rows.push({
								id: buildRowId(member.id, values.period),
								period: values.period,
								savedPeriod: values.period,
								combinedLimit: values.maxTokens,
								inputLimit: values.maxInputTokens,
								outputLimit: values.maxOutputTokens,
								isActive: true,
							});
						}
						map.set(member.id, existing);
						return map;
					}, new Map<string, GroupedLimitEntity>())
					.values(),
			)
				.map((entry) => ({
					...entry,
					rows: sortRows(entry.rows),
				}))
				.filter((entry) => entry.rows.length > 0)
				.sort((a, b) => a.name.localeCompare(b.name)),
		[members, memberOptions, getMemberLimitValues],
	);

	const groupedTeamLimits = useMemo<GroupedLimitEntity[]>(
		() =>
			Array.from(
				teamGroups
					.reduce((map, team) => {
						const existing = map.get(team.ID) ?? {
							id: team.ID,
							name: team.ID,
							details: [
								{ label: "Type", value: team.TYPE || "N/A" },
								{
									label: "Permission",
									value: String(team.PERMISSION),
								},
							],
							rows: [] as GroupedLimitRow[],
							option: teamOptions.find(
								(option) => option.id === team.ID,
							),
						};

						const values = getTeamLimitValues(team);
						const hasAny = hasAnyTokenLimitValue(values);
						if (hasAny) {
							existing.rows.push({
								id: buildRowId(team.ID, values.period),
								period: values.period,
								savedPeriod: values.period,
								combinedLimit: values.maxTokens,
								inputLimit: values.maxInputTokens,
								outputLimit: values.maxOutputTokens,
								isActive: true,
							});
						}
						map.set(team.ID, existing);
						return map;
					}, new Map<string, GroupedLimitEntity>())
					.values(),
			)
				.map((entry) => ({
					...entry,
					rows: sortRows(entry.rows),
				}))
				.filter((entry) => entry.rows.length > 0)
				.sort((a, b) => a.name.localeCompare(b.name)),
		[teamGroups, teamOptions, getTeamLimitValues],
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
						? `Configure token limits for this ${entityTypeLabel} using platform-wide, default-user, per-user, default-team, and per-team controls.`
						: `Configure token limits for this ${entityTypeLabel} using default-user, per-user, default-team, and per-team controls.`}
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
												Total usage limits across all
												users for this model, by period.
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
												removePlatformLimit(
													(
														platformLimits.find(
															(source) =>
																source.id ===
																limit.id,
														) ?? limit
													).period,
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
				description={`Apply default token limits for users on this ${entityTypeLabel}, one row per time period.`}
				open={userSectionOpen}
				onOpenChange={setUserSectionOpen}
				limits={displayedDefaultUserLimits}
				newLimit={newDefaultUserRow}
				setNewLimit={setNewDefaultUserRow}
				remainingPeriods={remainingDefaultUserPeriods}
				onCreateLimit={(period) =>
					createDraftFromValues(
						{
							...DEFAULT_LIMIT_DRAFT._saved,
							period,
						},
						`default-user-limit-${period}`,
					)
				}
				onSaveLimit={saveDefaultUserLimit}
				onDeleteLimit={removeDefaultUserLimit}
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
					const selectableRows = existingRows.filter(
						(row) => row.period !== "MONTH",
					);
					return selectableRows.length < UI_TIME_PERIODS.length;
				})}
				emptyMessage="No per-user limits configured."
				multiPeriod
				savingIds={savingUserIds}
				supportsActive={false}
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
					const selectableRows = existingRows.filter(
						(row) => row.period !== "MONTH",
					);
					const nextPeriod =
						UI_TIME_PERIODS.find(
							(period) =>
								!selectableRows.some(
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
								isActive: true,
							},
						]),
					}));
				}}
				onSaveSingleRow={async (entityUserId, row) => {
					const success = await saveUserLimitRow(entityUserId, {
						entityId: entityUserId,
						entityName: entityUserId,
						entityDetails: [],
						combinedLimit: row.combinedLimit,
						inputLimit: row.inputLimit,
						outputLimit: row.outputLimit,
						period: row.period,
						savedPeriod: row.savedPeriod,
						isActive: true,
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
					removeUserLimitRow(
						entityUserId,
						row.savedPeriod ?? row.period,
					);
				}}
			/>

			<DefaultLimitsSection
				title="Default Team Limits"
				description={`Apply default token limits for teams on this ${entityTypeLabel}, one row per time period.`}
				open={teamSectionOpen}
				onOpenChange={setTeamSectionOpen}
				limits={displayedDefaultTeamLimits}
				newLimit={newDefaultTeamRow}
				setNewLimit={setNewDefaultTeamRow}
				remainingPeriods={remainingDefaultTeamPeriods}
				onCreateLimit={(period) =>
					createDraftFromValues(
						{
							...DEFAULT_LIMIT_DRAFT._saved,
							period,
						},
						`default-team-limit-${period}`,
					)
				}
				onSaveLimit={saveDefaultTeamLimit}
				onDeleteLimit={removeDefaultTeamLimit}
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
					const selectableRows = existingRows.filter(
						(row) => row.period !== "MONTH",
					);
					return selectableRows.length < UI_TIME_PERIODS.length;
				})}
				emptyMessage="No per-team limits configured."
				multiPeriod
				savingIds={savingTeamIds}
				supportsActive={false}
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
					const selectableRows = existingRows.filter(
						(row) => row.period !== "MONTH",
					);
					const nextPeriod =
						UI_TIME_PERIODS.find(
							(period) =>
								!selectableRows.some(
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
								isActive: true,
							},
						]),
					}));
				}}
				onSaveSingleRow={async (teamId, row) => {
					const success = await saveTeamLimitRow(teamId, {
						entityId: teamId,
						entityName: teamId,
						entityDetails: [],
						combinedLimit: row.combinedLimit,
						inputLimit: row.inputLimit,
						outputLimit: row.outputLimit,
						period: row.period,
						savedPeriod: row.savedPeriod,
						isActive: true,
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
					removeTeamLimitRow(teamId, row.savedPeriod ?? row.period);
				}}
			/>
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
}) => (
	<>
		<div className="flex items-center gap-2">
			<Label className="whitespace-nowrap text-xs">Combined:</Label>
			<Input
				type="number"
				value={limit.maxTokens ?? ""}
				onChange={(e) =>
					onChange({
						...limit,
						maxTokens: parseNullableNumber(e.target.value),
					})
				}
				disabled={disabled}
				className="h-8 w-28"
			/>
		</div>
		<div className="flex items-center gap-2">
			<Label className="whitespace-nowrap text-xs">Input:</Label>
			<Input
				type="number"
				value={limit.maxInputTokens ?? ""}
				onChange={(e) =>
					onChange({
						...limit,
						maxInputTokens: parseNullableNumber(e.target.value),
					})
				}
				disabled={disabled}
				className="h-8 w-28"
			/>
		</div>
		<div className="flex items-center gap-2">
			<Label className="whitespace-nowrap text-xs">Output:</Label>
			<Input
				type="number"
				value={limit.maxOutputTokens ?? ""}
				onChange={(e) =>
					onChange({
						...limit,
						maxOutputTokens: parseNullableNumber(e.target.value),
					})
				}
				disabled={disabled}
				className="h-8 w-28"
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
