import { useCallback, useEffect, useMemo, useState } from "react";
import { Env, get, post, runPixel } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import {
	getGroupsWithAccessToEngine,
	getGroupsWithAccessToProject,
} from "@/api/teams";
import type { TimePeriod, TokenLimitEntry } from "../types";

interface LimitValues {
	period: TimePeriod;
	maxTokens: number | null;
	maxInputTokens: number | null;
	maxOutputTokens: number | null;
	isActive: boolean;
}

interface EditablePrincipalLimitRow {
	period: TimePeriod;
	savedPeriod?: TimePeriod;
	combinedLimit: number | null;
	inputLimit: number | null;
	outputLimit: number | null;
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

interface PrincipalUserTokenLimit {
	userId: string;
	engineId?: string;
	projectId?: string;
	usageFrequency?: string | null;
	maxTokens?: number | null;
	maxInputTokens?: number | null;
	maxOutputTokens?: number | null;
	maxResponseTime?: number | null;
	restrictPerModel?: boolean | null;
	isActive?: boolean | null;
}

interface PrincipalTeamTokenLimit {
	groupId: string;
	groupType: string;
	engineId?: string;
	projectId?: string;
	usageFrequency?: string | null;
	maxTokens?: number | null;
	maxInputTokens?: number | null;
	maxOutputTokens?: number | null;
	maxResponseTime?: number | null;
	restrictPerModel?: boolean | null;
	isActive?: boolean | null;
}

const DEFAULT_LIMIT_VALUES: LimitValues = {
	period: "DAY",
	maxTokens: null,
	maxInputTokens: null,
	maxOutputTokens: null,
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

const ALL_ENGINES_SENTINEL = "__ALL__";

const pixelValue = (value: string | number | boolean) => {
	if (typeof value === "string") {
		return JSON.stringify(value);
	}
	return String(value);
};

const buildPixel = (
	reactorName: string,
	params: Record<string, string | number | boolean | null | undefined>,
) => {
	const args = Object.entries(params)
		.filter(([, value]) => value !== null && value !== undefined)
		.map(
			([key, value]) =>
				`${key}=[${pixelValue(value as string | number | boolean)}]`,
		)
		.join(", ");
	return `${reactorName}(${args});`;
};

const runTokenLimitReactor = async <T>(
	reactorName: string,
	params: Record<string, string | number | boolean | null | undefined>,
): Promise<T> => {
	const response = await runPixel<[T]>(buildPixel(reactorName, params));
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}
	return response.pixelReturn[0]?.output as T;
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

export const hasAnyTokenLimitValue = ({
	maxTokens,
	maxInputTokens,
	maxOutputTokens,
}: Pick<LimitValues, "maxTokens" | "maxInputTokens" | "maxOutputTokens">) =>
	maxTokens != null || maxInputTokens != null || maxOutputTokens != null;

const serializeNullableLimit = (value: number | null) =>
	value == null ? "" : value;

const serializeReactorLimit = (value: number | null) =>
	value == null ? -1 : value;

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

	const [loading, setLoading] = useState(true);
	const [members, setMembers] = useState<MemberPermissionUser[]>([]);
	const [teamGroups, setTeamGroups] = useState<TeamPermissionGroup[]>([]);
	const [userTokenLimits, setUserTokenLimits] = useState<
		PrincipalUserTokenLimit[]
	>([]);
	const [teamTokenLimits, setTeamTokenLimits] = useState<
		PrincipalTeamTokenLimit[]
	>([]);
	const [defaultUserLimits, setDefaultUserLimits] = useState<
		TokenLimitEntry[]
	>([]);
	const [defaultTeamLimits, setDefaultTeamLimits] = useState<
		TokenLimitEntry[]
	>([]);
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

	const mapFrequency = useCallback((value?: string | null): TimePeriod => {
		if (!value) return "DAY";
		const upper = value.toUpperCase() as TimePeriod;
		return PERIODS.includes(upper) ? upper : "DAY";
	}, []);

	const parseLimit = useCallback((value?: number | null): number | null => {
		if (value == null || Number.isNaN(value) || value < 0) {
			return null;
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

	const toTokenLimitEntries = useCallback(
		(
			payload:
				| {
						usageFrequency?: string | null;
						maxTokens?: number | null;
						maxInputTokens?: number | null;
						maxOutputTokens?: number | null;
						isActive?: boolean | null;
				  }
				| {
						usageFrequency?: string | null;
						maxTokens?: number | null;
						maxInputTokens?: number | null;
						maxOutputTokens?: number | null;
						isActive?: boolean | null;
				  }[]
				| null
				| undefined,
			idPrefix: string,
		) => {
			const rows = Array.isArray(payload)
				? payload
				: payload
					? [payload]
					: [];
			return rows
				.map((limit) => {
					const period = mapFrequency(limit.usageFrequency);
					return toTokenLimitEntry(limit, `${idPrefix}-${period}`);
				})
				.sort(
					(a, b) =>
						PERIODS.indexOf(a.period) - PERIODS.indexOf(b.period),
				);
		},
		[mapFrequency, toTokenLimitEntry],
	);

	const fetchDefaultUserLimits = useCallback(async () => {
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/getEngineDefaultTokenLimit?engineId=${encodeURIComponent(entityId)}`
				: `${Env.MODULE}/api/auth/project/getProjectDefaultTokenLimit?projectId=${encodeURIComponent(entityId)}`;
			const response = await get<
				| {
						usageFrequency?: string | null;
						maxTokens?: number | null;
						maxInputTokens?: number | null;
						maxOutputTokens?: number | null;
						isActive?: boolean | null;
				  }
				| {
						usageFrequency?: string | null;
						maxTokens?: number | null;
						maxInputTokens?: number | null;
						maxOutputTokens?: number | null;
						isActive?: boolean | null;
				  }[]
				| null
			>(url);
			setDefaultUserLimits(
				toTokenLimitEntries(response?.data, "default-user-limit"),
			);
		} catch {
			setDefaultUserLimits([]);
		}
	}, [entityId, isModel, toTokenLimitEntries]);

	const fetchDefaultTeamLimits = useCallback(async () => {
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/getEngineDefaultTeamTokenLimit?engineId=${encodeURIComponent(entityId)}`
				: `${Env.MODULE}/api/auth/project/getProjectDefaultTeamTokenLimit?projectId=${encodeURIComponent(entityId)}`;
			const response = await get<
				| {
						usageFrequency?: string | null;
						maxTokens?: number | null;
						maxInputTokens?: number | null;
						maxOutputTokens?: number | null;
						isActive?: boolean | null;
				  }
				| {
						usageFrequency?: string | null;
						maxTokens?: number | null;
						maxInputTokens?: number | null;
						maxOutputTokens?: number | null;
						isActive?: boolean | null;
				  }[]
				| null
			>(url);
			setDefaultTeamLimits(
				toTokenLimitEntries(response?.data, "default-team-limit"),
			);
		} catch {
			setDefaultTeamLimits([]);
		}
	}, [entityId, isModel, toTokenLimitEntries]);

	const fetchMemberLimits = useCallback(async () => {
		const url = `${Env.MODULE}/api/auth/${entityPath}/${getUsersEndpoint}?${entityIdKey}=${encodeURIComponent(entityId)}&limit=1000&offset=0`;
		const [response, limits] = await Promise.all([
			get<{ members?: MemberPermissionUser[] }>(url),
			runTokenLimitReactor<PrincipalUserTokenLimit[]>(
				isModel
					? "GetEngineUserTokenLimits"
					: "GetProjectUserTokenLimits",
				isModel
					? { engineId: entityId }
					: {
							projectId: entityId,
							scopedEngineId: ALL_ENGINES_SENTINEL,
						},
			),
		]);
		setMembers(
			Array.isArray(response?.data?.members) ? response.data.members : [],
		);
		setUserTokenLimits(Array.isArray(limits) ? limits : []);
	}, [entityId, entityIdKey, entityPath, getUsersEndpoint, isModel]);

	const fetchTeamLimits = useCallback(async () => {
		const [response, limits] = await Promise.all([
			isModel
				? getGroupsWithAccessToEngine(entityId, 1000, 0)
				: getGroupsWithAccessToProject(entityId, 1000, 0),
			runTokenLimitReactor<PrincipalTeamTokenLimit[]>(
				isModel
					? "GetEngineTeamTokenLimits"
					: "GetProjectTeamTokenLimits",
				isModel
					? { engineId: entityId }
					: {
							projectId: entityId,
							scopedEngineId: ALL_ENGINES_SENTINEL,
						},
			),
		]);
		setTeamGroups(parseGroupsResponse(response));
		setTeamTokenLimits(Array.isArray(limits) ? limits : []);
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
				maxTokens: parseLimit(row.maxTokens) ?? 0,
				maxInputTokens: parseLimit(row.maxInputTokens) ?? 0,
				maxOutputTokens: parseLimit(row.maxOutputTokens) ?? 0,
				maxResponseTime:
					typeof row.maxResponseTime === "number"
						? row.maxResponseTime
						: 0,
				isActive: row.isActive !== false,
				tokensUsed: parseLimit(row.tokensUsed) ?? 0,
				inputTokensUsed: parseLimit(row.inputTokensUsed) ?? 0,
				outputTokensUsed: parseLimit(row.outputTokensUsed) ?? 0,
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
			await fetchDefaultUserLimits();
			await fetchDefaultTeamLimits();
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
		fetchDefaultTeamLimits,
		fetchDefaultUserLimits,
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
				existingUsageFrequency: draft._saved.period,
				maxTokens: serializeNullableLimit(draft.maxTokens),
				maxInputTokens: serializeNullableLimit(draft.maxInputTokens),
				maxOutputTokens: serializeNullableLimit(draft.maxOutputTokens),
				isActive: draft.isActive,
				restrictPerModel: false,
			});
			await fetchDefaultUserLimits();
			await fetchMemberLimits();
			toast.success("Default user limits saved");
			return true;
		} catch (e) {
			console.error("Failed to save default user limits", e);
			toast.error("Failed to save default user limits");
			return false;
		} finally {
			setSavingDefaultLimit(false);
		}
	};

	const removeDefaultUserLimit = async (period: TimePeriod) => {
		setSavingDefaultLimit(true);
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/removeEngineDefaultTokenLimit`
				: `${Env.MODULE}/api/auth/project/removeProjectDefaultTokenLimit`;
			await post(url, {
				[entityIdKey]: entityId,
				usageFrequency: period,
			});
			await fetchDefaultUserLimits();
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
				existingUsageFrequency: draft._saved.period,
				maxTokens: serializeNullableLimit(draft.maxTokens),
				maxInputTokens: serializeNullableLimit(draft.maxInputTokens),
				maxOutputTokens: serializeNullableLimit(draft.maxOutputTokens),
				isActive: draft.isActive,
			});
			await fetchDefaultTeamLimits();
			await fetchTeamLimits();
			toast.success("Default team limits saved");
			return true;
		} catch (e) {
			console.error("Failed to save default team limits", e);
			toast.error("Failed to save default team limits");
			return false;
		} finally {
			setSavingDefaultTeamLimit(false);
		}
	};

	const removeDefaultTeamLimit = async (period: TimePeriod) => {
		setSavingDefaultTeamLimit(true);
		try {
			const url = isModel
				? `${Env.MODULE}/api/auth/engine/removeEngineDefaultTeamTokenLimit`
				: `${Env.MODULE}/api/auth/project/removeProjectDefaultTeamTokenLimit`;
			await post(url, {
				[entityIdKey]: entityId,
				usageFrequency: period,
			});
			await fetchDefaultTeamLimits();
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
					maxTokens: serializeNullableLimit(limit.maxTokens),
					maxInputTokens: serializeNullableLimit(
						limit.maxInputTokens,
					),
					maxOutputTokens: serializeNullableLimit(
						limit.maxOutputTokens,
					),
					maxResponseTime: -1,
					isActive: limit.isActive,
				},
			);
			await fetchPlatformLimits();
			toast.success("Platform model limit saved");
			return true;
		} catch (e) {
			console.error("Failed to save model platform limit", e);
			toast.error("Failed to save model platform limit");
			return false;
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

	const saveUserLimitRow = async (
		memberId: string,
		row: EditablePrincipalLimitRow,
	) => {
		const base = members.find((member) => member.id === memberId);
		if (!base) {
			toast.error("Unable to find member to update");
			return false;
		}

		setSavingUserIds((prev) => new Set(prev).add(memberId));
		try {
			await runTokenLimitReactor(
				isModel
					? "SetEngineUserTokenLimit"
					: "SetProjectUserTokenLimit",
				isModel
					? {
							engineId: entityId,
							userId: base.id,
							usageFrequency: row.period,
							existingUsageFrequency:
								row.savedPeriod ?? row.period,
							maxTokens: serializeReactorLimit(row.combinedLimit),
							maxInputTokens: serializeReactorLimit(
								row.inputLimit,
							),
							maxOutputTokens: serializeReactorLimit(
								row.outputLimit,
							),
							maxResponseTime: -1,
							isActive: row.isActive,
						}
					: {
							projectId: entityId,
							userId: base.id,
							scopedEngineId: ALL_ENGINES_SENTINEL,
							usageFrequency: row.period,
							existingUsageFrequency:
								row.savedPeriod ?? row.period,
							maxTokens: serializeReactorLimit(row.combinedLimit),
							maxInputTokens: serializeReactorLimit(
								row.inputLimit,
							),
							maxOutputTokens: serializeReactorLimit(
								row.outputLimit,
							),
							maxResponseTime: -1,
							restrictPerModel: false,
							isActive: row.isActive,
						},
			);
			await fetchMemberLimits();
			toast.success("User limit saved");
			return true;
		} catch (e) {
			console.error("Failed to update user token limits", e);
			toast.error("Failed to update user limit");
			return false;
		} finally {
			setSavingUserIds((prev) => {
				const next = new Set(prev);
				next.delete(memberId);
				return next;
			});
		}
	};

	const removeUserLimitRow = async (memberId: string, period: TimePeriod) => {
		const base = members.find((member) => member.id === memberId);
		if (!base) {
			toast.error("Unable to find member to update");
			return false;
		}

		setSavingUserIds((prev) => new Set(prev).add(memberId));
		try {
			await runTokenLimitReactor(
				isModel
					? "RemoveEngineUserTokenLimit"
					: "RemoveProjectUserTokenLimit",
				isModel
					? {
							engineId: entityId,
							userId: base.id,
							usageFrequency: period,
						}
					: {
							projectId: entityId,
							userId: base.id,
							scopedEngineId: ALL_ENGINES_SENTINEL,
							usageFrequency: period,
						},
			);
			await fetchMemberLimits();
			toast.success("User limit removed");
			return true;
		} catch (e) {
			console.error("Failed to remove user token limit", e);
			toast.error("Failed to remove user limit");
			return false;
		} finally {
			setSavingUserIds((prev) => {
				const next = new Set(prev);
				next.delete(memberId);
				return next;
			});
		}
	};

	const saveTeamLimitRow = async (
		teamId: string,
		row: EditablePrincipalLimitRow,
	) => {
		const team = teamGroups.find((group) => group.ID === teamId);
		if (!team) {
			toast.error("Unable to find team to update");
			return;
		}

		setSavingTeamIds((prev) => new Set(prev).add(teamId));
		try {
			await runTokenLimitReactor(
				isModel
					? "SetEngineTeamTokenLimit"
					: "SetProjectTeamTokenLimit",
				isModel
					? {
							groupId: team.ID,
							groupType: team.TYPE,
							engineId: entityId,
							usageFrequency: row.period,
							existingUsageFrequency:
								row.savedPeriod ?? row.period,
							maxTokens: serializeReactorLimit(row.combinedLimit),
							maxInputTokens: serializeReactorLimit(
								row.inputLimit,
							),
							maxOutputTokens: serializeReactorLimit(
								row.outputLimit,
							),
							maxResponseTime: -1,
							isActive: row.isActive,
						}
					: {
							groupId: team.ID,
							groupType: team.TYPE,
							projectId: entityId,
							scopedEngineId: ALL_ENGINES_SENTINEL,
							usageFrequency: row.period,
							existingUsageFrequency:
								row.savedPeriod ?? row.period,
							maxTokens: serializeReactorLimit(row.combinedLimit),
							maxInputTokens: serializeReactorLimit(
								row.inputLimit,
							),
							maxOutputTokens: serializeReactorLimit(
								row.outputLimit,
							),
							maxResponseTime: -1,
							restrictPerModel: false,
							isActive: row.isActive,
						},
			);
			await fetchTeamLimits();
			toast.success("Team limit saved");
			return true;
		} catch (e) {
			console.error("Failed to update team token limit", e);
			toast.error("Failed to update team limit");
			return false;
		} finally {
			setSavingTeamIds((prev) => {
				const next = new Set(prev);
				next.delete(teamId);
				return next;
			});
		}
	};

	const removeTeamLimitRow = async (teamId: string, period: TimePeriod) => {
		const team = teamGroups.find((group) => group.ID === teamId);
		if (!team) {
			toast.error("Unable to find team to update");
			return;
		}

		setSavingTeamIds((prev) => new Set(prev).add(teamId));
		try {
			await runTokenLimitReactor(
				isModel
					? "RemoveEngineTeamTokenLimit"
					: "RemoveProjectTeamTokenLimit",
				isModel
					? {
							groupId: team.ID,
							groupType: team.TYPE,
							engineId: entityId,
							usageFrequency: period,
						}
					: {
							groupId: team.ID,
							groupType: team.TYPE,
							projectId: entityId,
							scopedEngineId: ALL_ENGINES_SENTINEL,
							usageFrequency: period,
						},
			);
			await fetchTeamLimits();
			toast.success("Team limit removed");
			return true;
		} catch (e) {
			console.error("Failed to remove team token limit", e);
			toast.error("Failed to remove team limit");
			return false;
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
			Array.from(
				new Map(
					teamGroups.map((team) => [
						team.ID,
						{
							id: team.ID,
							name: team.ID,
							teamType: team.TYPE || "",
							permission: permissionToString(team.PERMISSION),
						},
					]),
				).values(),
			),
		[teamGroups],
	);

	return {
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
		mapFrequency,
		parseLimit,
		toTokenLimitEntry,
		memberOptions,
		teamOptions,
		refreshData,
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
	};
};
