//Centralized builders for the Audit Log pixel reactors so the report table, the
//CSV/PDF export, and the filter-option dropdowns all share a single contract.
//
//IMPORTANT: limit and offset are TOP-LEVEL pixel keys, NOT inside paramValues.

export type AuditLogDateRangeType = "DAY" | "WEEK" | "MONTH" | "CUSTOM";

//Exactly one of these scope ids identifies the project/engine/room the logs belong to.
export interface AuditLogScope {
	projectId?: string;
	engineId?: string;
	roomId?: string;
}

//Multi-select server-side filters (IN clause). Values come from
//GetAuditLogsReportFilterOptionList.
export interface AuditLogSearch {
	methodName?: string[];
	engineType?: string[];
}

export interface AuditLogReportParams {
	scope: AuditLogScope;
	sessionId?: string;
	//Optional room filter (free-text room id), passed through to the report.
	roomId?: string;
	//Owner-only; the backend ignores it (and forces the caller's own id) for non-owners.
	filterUserId?: string;
	//Date params are optional — omit them entirely to let the backend apply no date
	//window (e.g. the room activity log sends only the scope).
	dateRangeType?: AuditLogDateRangeType;
	dateRangeValue?: number;
	startDate?: string; //ISO, custom range only
	endDate?: string; //ISO, custom range only
	search?: AuditLogSearch;
	//Global free-text search; the backend matches it against methodName + engineType only.
	searchTerm?: string;
}

export type AuditLogFilterName =
	| "methodName"
	| "engineType"
	| "user"
	| "roomId";

//Resolved date bounds, shared by the report, the option lists, and the export so
//all three agree (the backend now date-scopes the option lists too).
export interface AuditLogDateParams {
	dateRangeType: AuditLogDateRangeType;
	dateRangeValue: number;
	startDate?: string; //ISO, custom range only
	endDate?: string; //ISO, custom range only
}

export interface AuditLogFilterOptionParams {
	filterName: AuditLogFilterName;
	scope: AuditLogScope;
	engineType?: string; //optional extra scope (e.g. method names for one engine type)
	filterUserId?: string; //owner-only
	search?: string; //type-ahead, narrows by display value
	//Pass the SAME date params used for the table so the dropdowns match the rows.
	date?: AuditLogDateParams;
}

//The shape the AuditLogFilter component emits on every change. Pages convert this
//into AuditLogReportParams with filterValueToReportParams.
export interface AuditLogFilterValue {
	scope: AuditLogScope | null;
	dateRangeType: AuditLogDateRangeType;
	dateRangeValue: number;
	customDateRange: { from: Date | null; to: Date | null };
	methodNames: string[];
	engineTypes: string[];
	filterUserId: string;
	roomId: string;
	searchTerm: string;
}

//A scope is usable once it carries one of the allowed ids.
export const hasScope = (scope: AuditLogScope | null | undefined): boolean =>
	Boolean(scope && (scope.projectId || scope.engineId || scope.roomId));

//Resolve a duration selection into concrete date params (with ISO bounds for the
//custom range). Single source of truth so the table, dropdowns, and export agree.
export const resolveDateParams = (selection: {
	dateRangeType: AuditLogDateRangeType;
	dateRangeValue: number;
	customDateRange?: { from: Date | null; to: Date | null };
}): AuditLogDateParams => {
	const date: AuditLogDateParams = {
		dateRangeType: selection.dateRangeType || "DAY",
		dateRangeValue: selection.dateRangeValue || 1,
	};
	if (
		selection.dateRangeType === "CUSTOM" &&
		selection.customDateRange?.from &&
		selection.customDateRange?.to
	) {
		const start = new Date(selection.customDateRange.from);
		const end = new Date(selection.customDateRange.to);
		start.setUTCHours(0, 0, 0, 0);
		end.setUTCHours(23, 59, 59, 999);
		date.startDate = start.toISOString();
		date.endDate = end.toISOString();
	}
	return date;
};

//Write resolved date params onto a paramValues map.
const applyDateParams = (
	paramValues: Record<string, unknown>,
	date: AuditLogDateParams,
) => {
	paramValues.dateRangeType = date.dateRangeType;
	paramValues.dateRangeValue = date.dateRangeValue;
	if (date.dateRangeType === "CUSTOM") {
		if (date.startDate) paramValues.startDate = date.startDate;
		if (date.endDate) paramValues.endDate = date.endDate;
	}
};

//Build the paramValues map shared by AuditLogsReport and ExportAuditLogsReport.
const buildReportParamValues = (
	params: AuditLogReportParams,
): Record<string, unknown> => {
	const { scope, search } = params;
	const paramValues: Record<string, unknown> = {};

	if (scope.projectId) paramValues.projectId = scope.projectId;
	if (scope.engineId) paramValues.engineId = scope.engineId;
	if (scope.roomId) paramValues.roomId = scope.roomId;

	if (params.sessionId) paramValues.sessionId = params.sessionId;
	if (params.roomId) paramValues.roomId = params.roomId;
	if (params.filterUserId) paramValues.filterUserId = params.filterUserId;

	//Only send date params when a range is set; omitting them entirely means no
	//date filter (the room activity log relies on this).
	if (params.dateRangeType) {
		applyDateParams(paramValues, {
			dateRangeType: params.dateRangeType,
			dateRangeValue: params.dateRangeValue ?? 1,
			startDate: params.startDate,
			endDate: params.endDate,
		});
	}

	const nestedSearch: AuditLogSearch = {};
	if (search?.methodName?.length) nestedSearch.methodName = search.methodName;
	if (search?.engineType?.length) nestedSearch.engineType = search.engineType;
	if (Object.keys(nestedSearch).length > 0) paramValues.search = nestedSearch;

	const trimmedTerm = params.searchTerm?.trim();
	if (trimmedTerm) paramValues.searchTerm = trimmedTerm;

	return paramValues;
};

export const buildAuditLogReportPixel = (
	params: AuditLogReportParams,
	limit: number,
	offset: number,
): string => {
	const paramValues = buildReportParamValues(params);
	return `AuditLogsReport(paramValues=[${JSON.stringify(paramValues)}], limit=[${limit}], offset=[${offset}]);`;
};

export const buildExportAuditLogReportPixel = (
	params: AuditLogReportParams,
	limit: number,
	offset: number,
	pdf: boolean,
): string => {
	const paramValues = buildReportParamValues(params);
	if (pdf) paramValues.pdfFormat = "true";
	return `ExportAuditLogsReport(paramValues=[${JSON.stringify(paramValues)}], limit=[${limit}], offset=[${offset}]);`;
};

export const buildFilterOptionListPixel = (
	params: AuditLogFilterOptionParams,
	limit = 100,
	offset = 0,
): string => {
	const paramValues: Record<string, unknown> = {
		filterName: params.filterName,
	};

	if (params.scope.projectId) paramValues.projectId = params.scope.projectId;
	if (params.scope.engineId) paramValues.engineId = params.scope.engineId;
	if (params.scope.roomId) paramValues.roomId = params.scope.roomId;

	if (params.engineType) paramValues.engineType = params.engineType;
	if (params.filterUserId) paramValues.filterUserId = params.filterUserId;
	const trimmedSearch = params.search?.trim();
	if (trimmedSearch) paramValues.search = trimmedSearch;

	//Date-scope the dropdown so its values match the visible rows.
	if (params.date) applyDateParams(paramValues, params.date);

	return `GetAuditLogsReportFilterOptionList(paramValues=[${JSON.stringify(paramValues)}], limit=[${limit}], offset=[${offset}]);`;
};

//Convert the filter component's emitted value into report params, resolving the
//custom date range into ISO start/end bounds. Pass { includeDate: false } to omit
//date params entirely (e.g. the room activity log sends only the scope).
export const filterValueToReportParams = (
	value: AuditLogFilterValue,
	options: { includeDate?: boolean } = {},
): AuditLogReportParams => {
	const { includeDate = true } = options;
	const params: AuditLogReportParams = {
		scope: value.scope ?? {},
		search: {
			methodName: value.methodNames,
			engineType: value.engineTypes,
		},
		searchTerm: value.searchTerm,
	};

	if (includeDate) {
		const date = resolveDateParams({
			dateRangeType: value.dateRangeType,
			dateRangeValue: value.dateRangeValue,
			customDateRange: value.customDateRange,
		});
		params.dateRangeType = date.dateRangeType;
		params.dateRangeValue = date.dateRangeValue;
		params.startDate = date.startDate;
		params.endDate = date.endDate;
	}

	if (value.filterUserId) params.filterUserId = value.filterUserId;
	if (value.roomId?.trim()) params.roomId = value.roomId.trim();

	return params;
};

//GetAuditLogsReportFilterOptionList returns List<String[]> (distinct rows).
export interface AuditLogUserOption {
	userName: string;
	userId: string;
	userType: string;
}

//methodName / engineType rows are single-column: ["<value>"].
export const parseSimpleFilterOptions = (output: unknown): string[] => {
	if (!Array.isArray(output)) return [];
	return output
		.map((row) => (Array.isArray(row) ? row[0] : row))
		.filter(
			(value): value is string =>
				typeof value === "string" && value.length > 0,
		);
};

//user rows are ["<userName>", "<userId>", "<userType>"].
export const parseUserFilterOptions = (
	output: unknown,
): AuditLogUserOption[] => {
	if (!Array.isArray(output)) return [];
	return output
		.filter((row): row is unknown[] => Array.isArray(row) && row.length > 0)
		.map((row) => ({
			userName: (row[0] as string) ?? "",
			userId: (row[1] as string) ?? "",
			userType: (row[2] as string) ?? "",
		}))
		.filter((user) => Boolean(user.userId));
};
