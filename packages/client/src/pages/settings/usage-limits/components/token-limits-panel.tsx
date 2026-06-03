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
import { TIME_PERIOD_LABELS } from "../constants";
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
		defaultUserLimit,
		defaultTeamLimit,
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
		saveUserLimitRows,
		saveTeamLimitRow,
	} = useTokenLimitsData({ entityType, entityId });

	const [userSectionOpen, setUserSectionOpen] = useState(true);
	const [teamSectionOpen, setTeamSectionOpen] = useState(true);
	const [platformSectionOpen, setPlatformSectionOpen] = useState(true);
	const [defaultUserDraft, setDefaultUserDraft] = useState<TokenLimitEntry>(
		defaultUserLimit ?? DEFAULT_LIMIT_DRAFT,
	);
	const [defaultTeamDraft, setDefaultTeamDraft] = useState<TokenLimitEntry>(
		defaultTeamLimit ?? DEFAULT_LIMIT_DRAFT,
	);
	const [showDefaultUserRow, setShowDefaultUserRow] = useState(
		!!defaultUserLimit,
	);
	const [showDefaultTeamRow, setShowDefaultTeamRow] = useState(
		!!defaultTeamLimit,
	);
	const [newPlatformRow, setNewPlatformRow] =
		useState<TokenLimitEntry | null>(null);

	useEffect(() => {
		setDefaultUserDraft(defaultUserLimit ?? DEFAULT_LIMIT_DRAFT);
		setShowDefaultUserRow(!!defaultUserLimit);
	}, [defaultUserLimit]);

	useEffect(() => {
		setDefaultTeamDraft(defaultTeamLimit ?? DEFAULT_LIMIT_DRAFT);
		setShowDefaultTeamRow(!!defaultTeamLimit);
	}, [defaultTeamLimit]);

	const groupedUserLimits = useMemo<GroupedLimitEntity[]>(
		() =>
			Array.from(
				members.reduce((map, member) => {
					const existing = map.get(member.id) ?? {
						id: member.id,
						name: member.name || member.id,
						details: [
							{ label: "ID", value: member.id },
							{ label: "Email", value: member.email || "N/A" },
							{ label: "Login", value: member.type || "N/A" },
						],
						rows: [] as GroupedLimitRow[],
						option: memberOptions.find(
							(option) => option.id === member.id,
						),
					};

					const values = getMemberLimitValues(member);
					const hasAny =
						values.maxTokens > 0 ||
						values.maxInputTokens > 0 ||
						values.maxOutputTokens > 0;
					if (hasAny) {
						existing.rows.push({
							id: buildRowId(member.id, values.period),
							period: values.period,
							combinedLimit: values.maxTokens,
							inputLimit: values.maxInputTokens,
							outputLimit: values.maxOutputTokens,
							isActive: true,
						});
					}
					map.set(member.id, existing);
					return map;
				}, new Map<string, GroupedLimitEntity>()),
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
			teamGroups
				.map((team) => {
					const values = getTeamLimitValues(team);
					const hasAny =
						values.maxTokens > 0 ||
						values.maxInputTokens > 0 ||
						values.maxOutputTokens > 0;
					return {
						id: team.ID,
						name: team.ID,
						details: [
							{ label: "Type", value: team.TYPE || "N/A" },
							{
								label: "Permission",
								value: String(team.PERMISSION),
							},
						],
						rows: hasAny
							? [
									{
										id: buildRowId(team.ID, values.period),
										period: values.period,
										combinedLimit: values.maxTokens,
										inputLimit: values.maxInputTokens,
										outputLimit: values.maxOutputTokens,
										isActive: true,
									},
								]
							: [],
						option: teamOptions.find(
							(option) => option.id === team.ID,
						),
					};
				})
				.filter((entry) => entry.rows.length > 0)
				.sort((a, b) => a.name.localeCompare(b.name)),
		[teamGroups, teamOptions, getTeamLimitValues],
	);

	const userRowsById = useMemo(
		() => new Map(groupedUserLimits.map((group) => [group.id, group.rows])),
		[groupedUserLimits],
	);
	const teamRowsById = useMemo(
		() =>
			new Map(
				groupedTeamLimits.map((group) => [group.id, group.rows[0]]),
			),
		[groupedTeamLimits],
	);
	const remainingPlatformPeriods = useMemo(
		() =>
			PERIODS.filter(
				(period) =>
					!platformLimits.some((row) => row.period === period),
			),
		[platformLimits],
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
													maxTokens: 100000,
													maxInputTokens: 60000,
													maxOutputTokens: 40000,
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
										onSave={() => {
											savePlatformLimit(newPlatformRow);
											setNewPlatformRow(null);
										}}
										isDirty
									>
										<PlatformRowFields
											limit={newPlatformRow}
											onChange={setNewPlatformRow}
										/>
									</EditableLimitRow>
								)}
								{platformLimits.map((limit) => {
									const usage =
										platformUsageByPeriod[limit.period];
									const isSaving = savingPlatformIds.has(
										limit.id,
									);
									return (
										<PlatformLimitEditorRow
											key={limit.id}
											limit={limit}
											usage={usage}
											usedPeriods={platformLimits.map(
												(row) => row.period,
											)}
											disabled={isSaving}
											onDelete={() =>
												removePlatformLimit(
													limit.period,
												)
											}
											onSave={savePlatformLimit}
										/>
									);
								})}
								{platformLimits.length === 0 &&
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

			<DefaultLimitSection
				title="Default User Limits"
				description={`Apply one default limit profile to all users for this ${entityTypeLabel}.`}
				open={userSectionOpen}
				onOpenChange={setUserSectionOpen}
				draft={defaultUserDraft}
				setDraft={setDefaultUserDraft}
				showRow={showDefaultUserRow}
				onShowRow={() => {
					setDefaultUserDraft(
						createDraftFromValues(
							DEFAULT_LIMIT_DRAFT._saved,
							"default-user-limit",
						),
					);
					setShowDefaultUserRow(true);
				}}
				onSave={() => saveDefaultUserLimit(defaultUserDraft)}
				onDelete={() => {
					if (defaultUserLimit) {
						removeDefaultUserLimit();
						return;
					}
					setShowDefaultUserRow(false);
				}}
				isSaving={savingDefaultLimit}
			/>

			<GroupedLimitsSection
				title="Per-User Limits"
				description={`Group and manage per-user limits for this ${entityTypeLabel}.`}
				entityLabel="User"
				entities={groupedUserLimits}
				entityOptions={memberOptions.filter((option) => {
					const existingRows = userRowsById.get(option.id) ?? [];
					return existingRows.length < PERIODS.length;
				})}
				emptyMessage="No per-user limits configured."
				multiPeriod
				savingIds={savingUserIds}
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
						PERIODS.find(
							(period) =>
								!existingRows.some(
									(row) => row.period === period,
								),
						) ?? "DAY";
					const nextRows = sortRows([
						...existingRows,
						{
							id: buildRowId(user.id, nextPeriod),
							period: nextPeriod,
							combinedLimit:
								defaultUserLimit?.maxTokens ?? 100000,
							inputLimit:
								defaultUserLimit?.maxInputTokens ?? 60000,
							outputLimit:
								defaultUserLimit?.maxOutputTokens ?? 40000,
							isActive: true,
						},
					]);
					saveUserLimitRows(user.id, nextRows);
				}}
				onSaveRows={(entityUserId, rows) =>
					saveUserLimitRows(entityUserId, rows)
				}
				onRemoveEntityRow={(entityUserId, rowId) => {
					const nextRows = (
						userRowsById.get(entityUserId) ?? []
					).filter((row) => row.id !== rowId);
					saveUserLimitRows(entityUserId, nextRows);
				}}
			/>

			<DefaultLimitSection
				title="Default Team Limits"
				description={`Apply one default limit profile to all teams for this ${entityTypeLabel}.`}
				open={teamSectionOpen}
				onOpenChange={setTeamSectionOpen}
				draft={defaultTeamDraft}
				setDraft={setDefaultTeamDraft}
				showRow={showDefaultTeamRow}
				onShowRow={() => {
					setDefaultTeamDraft(
						createDraftFromValues(
							DEFAULT_LIMIT_DRAFT._saved,
							"default-team-limit",
						),
					);
					setShowDefaultTeamRow(true);
				}}
				onSave={() => saveDefaultTeamLimit(defaultTeamDraft)}
				onDelete={() => {
					if (defaultTeamLimit) {
						removeDefaultTeamLimit();
						return;
					}
					setShowDefaultTeamRow(false);
				}}
				isSaving={savingDefaultTeamLimit}
			/>

			<GroupedLimitsSection
				title="Per-Team Limits"
				description={`Group and manage per-team limits for this ${entityTypeLabel}.`}
				entityLabel="Team"
				entities={groupedTeamLimits}
				entityOptions={teamOptions.filter(
					(option) => !teamRowsById.has(option.id),
				)}
				emptyMessage="No per-team limits configured."
				multiPeriod={false}
				savingIds={savingTeamIds}
				renderEntityDetails={(team) => (
					<div>
						<div className="font-medium text-sm">{team.name}</div>
						<div className="text-muted-foreground text-xs">
							{team.teamType || "N/A"} ·{" "}
							{team.permission || "N/A"}
						</div>
					</div>
				)}
				onAddEntity={(team) =>
					saveTeamLimitRow(team.id, {
						entityId: team.id,
						entityName: team.name,
						entityDetails: [],
						combinedLimit: defaultTeamLimit?.maxTokens ?? 100000,
						inputLimit: defaultTeamLimit?.maxInputTokens ?? 60000,
						outputLimit: defaultTeamLimit?.maxOutputTokens ?? 40000,
						period: defaultTeamLimit?.period ?? "DAY",
						isActive: true,
					})
				}
				onSaveSingleRow={(teamId, row) =>
					saveTeamLimitRow(teamId, {
						entityId: teamId,
						entityName: teamId,
						entityDetails: [],
						combinedLimit: row.combinedLimit,
						inputLimit: row.inputLimit,
						outputLimit: row.outputLimit,
						period: row.period,
						isActive: row.isActive,
					})
				}
				onRemoveEntityRow={(teamId) =>
					saveTeamLimitRow(teamId, {
						entityId: teamId,
						entityName: teamId,
						entityDetails: [],
						combinedLimit: 0,
						inputLimit: 0,
						outputLimit: 0,
						period: "DAY",
						isActive: true,
					})
				}
			/>
		</div>
	);
}

const DefaultLimitSection = ({
	title,
	description,
	open,
	onOpenChange,
	draft,
	setDraft,
	showRow,
	onShowRow,
	onSave,
	onDelete,
	isSaving,
}: {
	title: string;
	description: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	draft: TokenLimitEntry;
	setDraft: (next: TokenLimitEntry) => void;
	showRow: boolean;
	onShowRow: () => void;
	onSave: () => void;
	onDelete: () => void;
	isSaving: boolean;
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
					{!showRow && (
						<Button size="sm" onClick={onShowRow}>
							<Plus className="mr-1 size-3" /> Add Limit
						</Button>
					)}
				</div>
			</div>
			<CollapsibleContent className="px-4 py-4">
				{showRow ? (
					<EditableLimitRow
						onDelete={onDelete}
						onSave={onSave}
						isDirty={isDirty(draft)}
					>
						<LimitFields
							limit={draft}
							onChange={setDraft}
							disabled={isSaving}
						/>
					</EditableLimitRow>
				) : (
					<p className="py-4 text-center text-muted-foreground text-sm">
						No limits configured.
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
	availablePeriods = PERIODS,
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
				value={limit.maxTokens}
				onChange={(e) =>
					onChange({
						...limit,
						maxTokens: parseInt(e.target.value, 10) || 0,
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
				value={limit.maxInputTokens ?? 0}
				onChange={(e) =>
					onChange({
						...limit,
						maxInputTokens: parseInt(e.target.value, 10) || 0,
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
				value={limit.maxOutputTokens ?? 0}
				onChange={(e) =>
					onChange({
						...limit,
						maxOutputTokens: parseInt(e.target.value, 10) || 0,
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
			availablePeriods={PERIODS.filter(
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
	usage,
	usedPeriods,
	disabled,
	onDelete,
	onSave,
}: {
	limit: TokenLimitEntry;
	usage?: {
		tokensUsed: number;
		inputTokensUsed: number;
		outputTokensUsed: number;
	};
	usedPeriods: TimePeriod[];
	disabled?: boolean;
	onDelete: () => void;
	onSave: (limit: TokenLimitEntry) => void;
}) => {
	const [draft, setDraft] = useState(limit);

	useEffect(() => {
		setDraft(limit);
	}, [limit]);

	return (
		<EditableLimitRow
			onDelete={onDelete}
			onSave={() => onSave(draft)}
			isDirty={isDirty(draft)}
		>
			<PlatformRowFields
				limit={draft}
				onChange={setDraft}
				disabled={disabled}
				usage={usage}
				usedPeriods={usedPeriods}
			/>
		</EditableLimitRow>
	);
};
