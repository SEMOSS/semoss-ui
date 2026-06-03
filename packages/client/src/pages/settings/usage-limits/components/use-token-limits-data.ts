import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Env, get, post } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import {
	getGroupsWithAccessToEngine,
	getGroupsWithAccessToProject,
} from "@/api/teams";
import type { ExceptionEntry, TimePeriod, TokenLimitEntry } from "../types";

interface LimitValues {
	period: TimePeriod;
	maxTokens: number;
	maxInputTokens: number;
	maxOutputTokens: number;
	isActive: boolean;
}

export interface MemberPermissionUser {
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

export interface TeamPermissionGroup {
	ID: string;
	TYPE: string;
	PERMISSION: number | string;
	DATEADDED?: string;
	USAGERESTRICTION?: string;
	USAGEFREQUENCY?: string;
	MAXTOKENS?: number | null;
	MAX_INPUT_TOKENS?: number | null;
	MAX_OUTPUT_TOKENS?: number | null;
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

const DEFAULT_LIMIT_VALUES: LimitValues = {
	period: "DAY",
	maxTokens: 100000,
	maxInputTokens: 60000,
	maxOutputTokens: 40000,
	isActive: true,
};

export const PERIODS = [
	"HOUR",
	"DAY",
	"WEEK",
	"MONTH",
	"YEAR",
	"ALL_TIME",
] as TimePeriod[];

export const DEFAULT_LIMIT_DRAFT: TokenLimitEntry = {
	id: "default-limit",
	period: "DAY",
	maxTokens: 100000,
	maxInputTokens: 60000,
	maxOutputTokens: 40000,
	isActive: true,
	_saved: { ...DEFAULT_LIMIT_VALUES },
};

export const createDraftFromValues = (
	values: LimitValues,
	id = "default-limit",
): TokenLimitEntry => ({
	id,
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

const parseGroupsResponse = (result: unknown) => {
	if (Array.isArray(result)) {
		return result as TeamPermissionGroup[];
	}
	if (result && typeof result === "object") {
		const payload = result as { groups?: TeamPermissionGroup[] };
		return Array.isArray(payload.groups) ? payload.groups : [];
	}
	return [] as TeamPermissionGroup[];
};

export const permissionToString = (permission: string | number | undefined) => {
	const value = String(permission ?? "").toUpperCase();
	if (value === "1") return "OWNER";
	if (value === "2") return "EDIT";
	if (value === "3") return "READ_ONLY";
	return value || "READ_ONLY";
};

export const useTokenLimitsData = ({
	entityType,
	entityId,
}: {
	entityType: "MODEL" | "APP";
	entityId: string;
}) => {
	const isModel = entityType === "MODEL";
	const entityPath = entityType === "MODEL" ? "engine" : "project";
	const entityIdKey = entityType === "MODEL" ? "engineId" : "projectId";
	const getUsersEndpoint =
		entityType === "MODEL" ? "getEngineUsers" : "getProjectUsers";
	const editUsersEndpoint =
		entityType === "MODEL"
			? "editEngineUserPermissions"
			: "editProjectUserPermissions";

	const [loading, setLoading] = useState(true);
	const [members, setMembers] = useState<MemberPermissionUser[]>([]);
	const [teamGroups, setTeamGroups] = useState<TeamPermissionGroup[]>([]);
	const [defaultUserLimit, setDefaultUserLimit] =
		useState<TokenLimitEntry | null>(null);
	const [defaultTeamLimit, setDefaultTeamLimit] =
		useState<TokenLimitEntry | null>(null);
	const [platformLimits, setPlatformLimits] = useState<TokenLimitEntry[]>([]);
	const [platformUsageByPeriod, setPlatformUsageByPeriod] = useState<
		Record<TimePeriod, Omit<ModelPlatformUsageLimit, "usageFrequency">>
	>(
		{} as Record<
			TimePeriod,
			Omit<ModelPlatformUsageLimit, "usageFrequency">
		>,
	);
	const [savingPlatformIds, setSavingPlatformIds] = useState<Set<string>>(
		new Set(),
	);
	const [savingDefaultLimit, setSavingDefaultLimit] = useState(false);
	const [savingDefaultTeamLimit, setSavingDefaultTeamLimit] = useState(false);
	const [savingUserIds, setSavingUserIds] = useState<Set<string>>(new Set());
	const [savingTeamIds, setSavingTeamIds] = useState<Set<string>>(new Set());
	const defaultUserLimitRef = useRef<TokenLimitEntry | null>(null);
	const defaultTeamLimitRef = useRef<TokenLimitEntry | null>(null);

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
		(
			limit: {
				usageFrequency?: string | null;
				maxTokens?: number | null;
				maxInputTokens?: number | null;
				maxOutputTokens?: number | null;
				isActive?: boolean | null;
			},
			id = "default-limit",
		) => {
			const values: LimitValues = {
				period: mapFrequency(limit.usageFrequency),
				maxTokens: parseLimit(limit.maxTokens),
				maxInputTokens: parseLimit(limit.maxInputTokens),
				maxOutputTokens: parseLimit(limit.maxOutputTokens),
				isActive: limit.isActive !== false,
			};
			return createDraftFromValues(values, id);
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

	const getTeamLimitValues = useCallback(
		(team: TeamPermissionGroup): LimitValues => ({
			period: mapFrequency(team.USAGEFREQUENCY),
			maxTokens: parseLimit(team.MAXTOKENS),
			maxInputTokens: parseLimit(team.MAX_INPUT_TOKENS),
			maxOutputTokens: parseLimit(team.MAX_OUTPUT_TOKENS),
			isActive: true,
		}),
		[mapFrequency, parseLimit],
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
				return;
			}
			const mapped = toTokenLimitEntry(raw, "default-user-limit");
			setDefaultUserLimit(mapped);
			defaultUserLimitRef.current = mapped;
		} catch {
			setDefaultUserLimit(null);
			defaultUserLimitRef.current = null;
		}
	}, [entityId, isModel, toTokenLimitEntry]);

	const fetchDefaultTeamLimit = useCallback(async () => {
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/getEngineDefaultTeamTokenLimit?engineId=${encodeURIComponent(entityId)}`
				: `${Env.MODULE}/api/auth/project/getProjectDefaultTeamTokenLimit?projectId=${encodeURIComponent(entityId)}`;
			const response = await get<{
				usageFrequency?: string | null;
				maxTokens?: number | null;
				maxInputTokens?: number | null;
				maxOutputTokens?: number | null;
				isActive?: boolean | null;
			} | null>(url);
			const raw = response?.data;
			if (!raw) {
				setDefaultTeamLimit(null);
				defaultTeamLimitRef.current = null;
				return;
			}
			const mapped = toTokenLimitEntry(raw, "default-team-limit");
			setDefaultTeamLimit(mapped);
			defaultTeamLimitRef.current = mapped;
		} catch {
			setDefaultTeamLimit(null);
			defaultTeamLimitRef.current = null;
		}
	}, [entityId, isModel, toTokenLimitEntry]);

	const fetchMemberLimits = useCallback(async () => {
		const url = `${Env.MODULE}/api/auth/${entityPath}/${getUsersEndpoint}?${entityIdKey}=${encodeURIComponent(entityId)}&limit=1000&offset=0`;
		const response = await get<{ members?: MemberPermissionUser[] }>(url);
		setMembers(
			Array.isArray(response?.data?.members) ? response.data.members : [],
		);
	}, [entityId, entityIdKey, entityPath, getUsersEndpoint]);

	const fetchTeamLimits = useCallback(async () => {
		const response = isModel
			? await getGroupsWithAccessToEngine(entityId, 1000, 0)
			: await getGroupsWithAccessToProject(entityId, 1000, 0);
		setTeamGroups(parseGroupsResponse(response));
	}, [entityId, isModel]);

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
			await fetchDefaultTeamLimit();
			await fetchMemberLimits();
			await fetchTeamLimits();
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
		fetchDefaultTeamLimit,
		fetchDefaultUserLimit,
		fetchMemberLimits,
		fetchPlatformLimits,
		fetchTeamLimits,
		isModel,
	]);

	useEffect(() => {
		refreshData();
	}, [refreshData]);

	const saveDefaultUserLimit = async (draft: TokenLimitEntry) => {
		setSavingDefaultLimit(true);
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/setEngineDefaultTokenLimit`
				: `${Env.MODULE}/api/auth/project/setProjectDefaultTokenLimit`;
			await post(url, {
				[entityIdKey]: entityId,
				usageFrequency: draft.period,
				maxTokens: draft.maxTokens,
				maxInputTokens: draft.maxInputTokens ?? 0,
				maxOutputTokens: draft.maxOutputTokens ?? 0,
				isActive: draft.isActive,
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
			await fetchDefaultUserLimit();
			await fetchMemberLimits();
			toast.success("Default user limits deleted");
		} catch (e) {
			console.error("Failed to remove default user limits", e);
			toast.error("Failed to remove default user limits");
		} finally {
			setSavingDefaultLimit(false);
		}
	};

	const saveDefaultTeamLimit = async (draft: TokenLimitEntry) => {
		setSavingDefaultTeamLimit(true);
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/setEngineDefaultTeamTokenLimit`
				: `${Env.MODULE}/api/auth/project/setProjectDefaultTeamTokenLimit`;
			await post(url, {
				[entityIdKey]: entityId,
				usageFrequency: draft.period,
				maxTokens: draft.maxTokens,
				maxInputTokens: draft.maxInputTokens ?? 0,
				maxOutputTokens: draft.maxOutputTokens ?? 0,
				isActive: draft.isActive,
			});
			await fetchDefaultTeamLimit();
			await fetchTeamLimits();
			toast.success("Default team limits saved");
		} catch (e) {
			console.error("Failed to save default team limits", e);
			toast.error("Failed to save default team limits");
		} finally {
			setSavingDefaultTeamLimit(false);
		}
	};

	const removeDefaultTeamLimit = async () => {
		setSavingDefaultTeamLimit(true);
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/removeEngineDefaultTeamTokenLimit`
				: `${Env.MODULE}/api/auth/project/removeProjectDefaultTeamTokenLimit`;
			await post(url, { [entityIdKey]: entityId });
			await fetchDefaultTeamLimit();
			await fetchTeamLimits();
			toast.success("Default team limits deleted");
		} catch (e) {
			console.error("Failed to remove default team limits", e);
			toast.error("Failed to remove default team limits");
		} finally {
			setSavingDefaultTeamLimit(false);
		}
	};

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

	const saveUserLimitRows = async (
		memberId: string,
		rows: ExceptionEntry[],
	) => {
		const memberRows = members.filter((m) => m.id === memberId);
		const base = memberRows[0];
		if (!base) {
			toast.error("Unable to find member to update");
			return;
		}

		setSavingUserIds((prev) => new Set(prev).add(memberId));
		try {
			const payloadRows =
				rows.length > 0
					? rows.map((row) => ({
							userid: base.id,
							permission: base.permission,
							type: base.type,
							usageRestriction:
								row.combinedLimit > 0 ||
								row.inputLimit > 0 ||
								row.outputLimit > 0
									? "token"
									: null,
							usageFrequency: row.period,
							maxTokens: row.combinedLimit || 0,
							maxInputTokens: row.inputLimit || 0,
							maxOutputTokens: row.outputLimit || 0,
							maxResponseTime: null,
						}))
					: [
							{
								userid: base.id,
								permission: base.permission,
								type: base.type,
								usageRestriction: null,
								usageFrequency: null,
								maxTokens: null,
								maxInputTokens: null,
								maxOutputTokens: null,
								maxResponseTime: null,
							},
						];

			await post(
				`${Env.MODULE}/api/auth/${entityPath}/${editUsersEndpoint}`,
				{
					[entityIdKey]: entityId,
					userpermissions: payloadRows,
				},
			);
			await fetchMemberLimits();
			toast.success("User limits saved");
		} catch (e) {
			console.error("Failed to update user token limits", e);
			toast.error("Failed to update user limits");
		} finally {
			setSavingUserIds((prev) => {
				const next = new Set(prev);
				next.delete(memberId);
				return next;
			});
		}
	};

	const saveTeamLimitRow = async (teamId: string, row: ExceptionEntry) => {
		const team = teamGroups.find((group) => group.ID === teamId);
		if (!team) {
			toast.error("Unable to find team to update");
			return;
		}

		setSavingTeamIds((prev) => new Set(prev).add(teamId));
		try {
			const endpoint = isModel
				? `${Env.MODULE}/api/auth/group/engine/editGroupAppPermission`
				: `${Env.MODULE}/api/auth/group/project/editGroupProjectPermission`;
			const hasAnyLimit =
				row.combinedLimit > 0 ||
				row.inputLimit > 0 ||
				row.outputLimit > 0;
			await post(endpoint, {
				groupId: team.ID,
				type: team.TYPE,
				[entityIdKey]: entityId,
				permission: permissionToString(team.PERMISSION),
				usageRestriction: hasAnyLimit ? "token" : "",
				usageFrequency: hasAnyLimit ? row.period : "",
				maxTokens: hasAnyLimit ? row.combinedLimit : "",
				maxInputTokens: hasAnyLimit ? row.inputLimit : "",
				maxOutputTokens: hasAnyLimit ? row.outputLimit : "",
				maxResponseTime: "",
			});
			await fetchTeamLimits();
			toast.success("Team limit saved");
		} catch (e) {
			console.error("Failed to update team token limit", e);
			toast.error("Failed to update team limit");
		} finally {
			setSavingTeamIds((prev) => {
				const next = new Set(prev);
				next.delete(teamId);
				return next;
			});
		}
	};

	const memberOptions = useMemo(
		() =>
			Array.from(
				new Map(
					members.map((member) => [
						member.id,
						{
							id: member.id,
							name: member.name || member.id,
							email: member.email || "",
							loginType: member.type || "",
						},
					]),
				).values(),
			),
		[members],
	);

	const teamOptions = useMemo(
		() =>
			teamGroups.map((team) => ({
				id: team.ID,
				name: team.ID,
				teamType: team.TYPE || "",
				permission: permissionToString(team.PERMISSION),
			})),
		[teamGroups],
	);

	return {
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
		mapFrequency,
		parseLimit,
		toTokenLimitEntry,
		getMemberLimitValues,
		getTeamLimitValues,
		memberOptions,
		teamOptions,
		refreshData,
		saveDefaultUserLimit,
		removeDefaultUserLimit,
		saveDefaultTeamLimit,
		removeDefaultTeamLimit,
		savePlatformLimit,
		removePlatformLimit,
		saveUserLimitRows,
		saveTeamLimitRow,
	};
};
