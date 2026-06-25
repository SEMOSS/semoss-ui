// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { ChevronDownIcon, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { runPixel } from "@semoss/sdk";
import {
	Button,
	Calendar, //Added calendar option newly to filter for handling Custom date range filtering
	type DateRange,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import {
	getUserEnginePermission,
	getUserProjectPermission,
} from "../../api/permissions";
import { dateFormat, ENGINE_TYPES } from "./common";
import {
	type AuditLogDateRangeType,
	type AuditLogScope,
	type AuditLogUserOption,
	buildFilterOptionListPixel,
	hasScope,
	parseSimpleFilterOptions,
	parseUserFilterOptions,
	resolveDateParams,
} from "./pixel";

//A userId can repeat across auth providers, so options are keyed by userId+userType.
const userOptionKey = (user: AuditLogUserOption) =>
	`${user.userId}::${user.userType}`;

//initial state of engine details
const initialAcc = {
	APP: [],
	MODEL: [],
	DATABASE: [],
	VECTOR: [],
	FUNCTION: [],
	STORAGE: [],
};

type OwnerStatus = "unknown" | "owner" | "non-owner";
//Dashboard durations for filtering logs based on duration like day, week, month, etc.
//`labelKey` resolves the display label through the `auditlog` i18n namespace.
const DashboardDurations = [
	{
		labelKey: "filter.dateRange.today",
		value: "today",
		dateRangeType: "DAY",
		dateRangeValue: 1,
	},
	{
		labelKey: "filter.dateRange.last7Days",
		value: "last7days",
		dateRangeType: "WEEK",
		dateRangeValue: 1,
	},
	{
		labelKey: "filter.dateRange.last30Days",
		value: "last30days",
		dateRangeType: "MONTH",
		dateRangeValue: 1,
	},
	{
		labelKey: "filter.dateRange.custom",
		value: "custom",
		renderWithSeparator: true,
		dateRangeType: "CUSTOM",
		dateRangeValue: 1,
	},
] as const;

interface AuditLogFilterProps {
	insightId: string;
	updateLogs: (value: import("./pixel").AuditLogFilterValue) => void;
	//"client" hides the scope selectors (scope comes from the route via `scope`);
	//null renders the engine-type + engine pickers used to choose the scope.
	parent?: "client" | null;
	//Fixed scope for the contextual client dashboard (project/engine from the route).
	scope?: AuditLogScope | null;
	//Hide the room-id dropdown (e.g. when already scoped to a single room).
	hideRoomFilter?: boolean;
	//Hide the date-range control (e.g. in the room activity log).
	hideDateFilter?: boolean;
	//Right-aligned actions rendered on the search line (e.g. export / refresh).
	actions?: React.ReactNode;
	//Optional custom runner for filter-option pixels (used by room-scoped reports).
	runFilterPixel?: (pixel: string) => Promise<{
		pixelReturn: {
			operationType: string[];
			output: unknown;
		}[];
	}>;
}

//A compact multi-select dropdown backed by the server-driven option lists.
const MultiSelectDropdown = ({
	label,
	options,
	selected,
	onChange,
	onOpen,
	loading,
	disabled,
}: {
	label: string;
	options: string[];
	selected: string[];
	onChange: (next: string[]) => void;
	//Called when the menu opens, so options are fetched on demand (not on page load).
	onOpen?: () => void;
	loading?: boolean;
	disabled?: boolean;
}) => {
	const { t } = useTranslation("auditlog");
	const summary =
		selected.length === 0
			? label
			: selected.length === 1
				? selected[0]
				: t("filter.countSummary", {
						label,
						count: selected.length,
					});
	return (
		<DropdownMenu
			onOpenChange={(open) => {
				if (open) onOpen?.();
			}}
		>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					disabled={disabled}
					className="flex w-[150px] justify-between self-center"
				>
					<span className="truncate">{summary}</span>
					<ChevronDownIcon className="ms-2 size-4 shrink-0" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="max-h-[300px] overflow-y-auto">
				{loading ? (
					<div className="px-2 py-1.5 text-muted-foreground text-sm">
						{t("filter.loading")}
					</div>
				) : options.length === 0 ? (
					<div className="px-2 py-1.5 text-muted-foreground text-sm">
						{t("filter.noOptions")}
					</div>
				) : (
					options.map((option) => (
						<DropdownMenuCheckboxItem
							key={`${label}-${option}`}
							checked={selected.includes(option)}
							onCheckedChange={(checked) => {
								onChange(
									checked
										? [...selected, option]
										: selected.filter(
												(value) => value !== option,
											),
								);
							}}
							onSelect={(event) => event.preventDefault()}
						>
							{option}
						</DropdownMenuCheckboxItem>
					))
				)}
				{selected.length > 0 && (
					<>
						<DropdownMenuSeparator />
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start font-normal"
							onClick={() => onChange([])}
						>
							<X className="me-2 size-4" />
							{t("filter.clear")}
						</Button>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

/**
 * AuditLogFilter component is used for filtering audit logs.
 *
 * It drives the server-side filter set documented by the AuditLogsReport contract:
 * scope (engine type + engine, when not contextual), date range, method name,
 * engine type, the owner-only user filter, and the global search term. Filter
 * options are populated from GetAuditLogsReportFilterOptionList; ownership is
 * resolved lazily when the user filter is opened.
 *
 * @param {AuditLogFilterProps} props - The props passed to the component
 * @returns {JSX.Element} - The rendered filter bar
 */
export const AuditLogFilter = (props: AuditLogFilterProps) => {
	const {
		insightId,
		updateLogs,
		parent = null,
		scope = null,
		hideRoomFilter = false,
		hideDateFilter = false,
		actions = null,
		runFilterPixel,
	} = props;
	const { t } = useTranslation("auditlog");
	const [engineDetails, setEngineDetails] = useState({ ...initialAcc }); //engine details for user
	const [engineSelectionDetails, setEngineSelectionDetails] = useState({
		engineType: "", // selected scope engine type
		engineId: "", //selected scope engine id
	});
	const [dashboardDuration, setDashboardDuration] = useState<
		(typeof DashboardDurations)[number]["value"] | ""
	>(""); //selected dashboard duration
	const [dateOpen, setDateOpen] = useState<boolean>(false); //date-range popover open state
	const [customDateRange, setCustomDateRange] = useState<DateRange | null>({
		from: new Date(),
		to: new Date(),
	}); //custom date range data

	//Server-side filters (driven by GetAuditLogsReportFilterOptionList). Option
	//lists are fetched lazily when a dropdown is opened, not on page load.
	const [methodOptions, setMethodOptions] = useState<string[]>([]);
	const [engineTypeOptions, setEngineTypeOptions] = useState<string[]>([]);
	const [userOptions, setUserOptions] = useState<AuditLogUserOption[]>([]);
	const [loadingFilters, setLoadingFilters] = useState<
		Record<string, boolean>
	>({});
	//Tracks the scope+date key each option list was last fetched for, so reopening
	//a dropdown doesn't refetch unless the scope or date window changed.
	const loadedKeyRef = useRef<Record<string, string>>({});
	//Skip the first reset pass: initial state is already clean and resetting it on
	//mount can emit a duplicate report fetch.
	const didInitializeRef = useRef(false);
	const lastScopeKeyRef = useRef<string>("");
	//Avoid duplicate report fetches when upstream state toggles but the effective
	//filter payload did not actually change (e.g. ownership resolution on load).
	const lastEmittedFilterKeyRef = useRef<string>("");
	const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
	const [selectedEngineTypes, setSelectedEngineTypes] = useState<string[]>(
		[],
	);
	const [selectedUserKey, setSelectedUserKey] = useState<string>("");
	const [searchInput, setSearchInput] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [roomOptions, setRoomOptions] = useState<string[]>([]);
	const [selectedRoomId, setSelectedRoomId] = useState<string>("");
	const [ownerStatus, setOwnerStatus] = useState<OwnerStatus>("unknown");
	const executeFilterPixel = (pixel: string) => {
		if (runFilterPixel) {
			return runFilterPixel(pixel);
		}
		return runPixel(pixel, insightId);
	};

	//The scope the report is actually run against. For the contextual client
	//dashboard it is supplied by the page; otherwise it follows the pickers.
	const effectiveScope = useMemo<AuditLogScope | null>(() => {
		if (parent === "client") {
			return scope ?? null;
		}
		if (!engineSelectionDetails.engineId) {
			return null;
		}
		return engineSelectionDetails.engineType === "APP"
			? { projectId: engineSelectionDetails.engineId }
			: { engineId: engineSelectionDetails.engineId };
	}, [parent, scope, engineSelectionDetails]);

	//Stable key so scope-dependent effects only refire on a real scope change.
	const scopeKey = useMemo(
		() => JSON.stringify(effectiveScope ?? {}),
		[effectiveScope],
	);

	//fetch engines + projects for the scope pickers (only when not contextual)
	useEffect(() => {
		if (parent === "client" || !insightId) return;
		async function getMyEngines() {
			const response = await runPixel(`MyEngines();`, insightId);
			const responseData = response.pixelReturn[0].output;
			let enginesDropdown = (
				responseData as Array<{
					engine_id: string;
					engine_type: string;
					engine_name: string;
				}>
			).reduce(
				(acc, engine) => {
					if (Object.hasOwn(acc, engine.engine_type)) {
						acc[engine.engine_type] = [
							...acc[engine.engine_type],
							{
								value: engine.engine_id,
								label: engine.engine_name,
							},
						];
					}
					return acc;
				},
				{ ...initialAcc },
			);
			const projectResponse = await runPixel(`MyProjects();`, insightId);
			const projectResponseData = projectResponse.pixelReturn[0].output;
			const projectsDropdown = (
				projectResponseData as Array<{
					project_id: string;
					project_type: string;
					project_name: string;
				}>
			).reduce(
				(acc, project) => {
					if (Object.hasOwn(acc, "APP")) {
						acc.APP = [
							...acc.APP,
							{
								value: project.project_id,
								label: project.project_name,
							},
						];
					}
					return acc;
				},
				{ ...initialAcc },
			);
			enginesDropdown = {
				...enginesDropdown,
				APP: projectsDropdown.APP,
			};
			setEngineDetails((prev) => ({ ...prev, ...enginesDropdown }));
		}
		getMyEngines();
	}, [insightId, parent]);

	//getting details about label, value, daterangetype and value of selected dashboard duration
	const SelectedDuration = useMemo(() => {
		return (
			DashboardDurations.find(
				(duration) => duration.value === dashboardDuration,
			) || {
				labelKey: "",
				value: "",
				dateRangeType: "DAY" as AuditLogDateRangeType,
				dateRangeValue: 1,
			}
		);
	}, [dashboardDuration]);

	//Resolved date params shared with the table, the option lists, and the export.
	const dateParams = useMemo(
		() =>
			resolveDateParams({
				dateRangeType: SelectedDuration.dateRangeType,
				dateRangeValue: SelectedDuration.dateRangeValue,
				customDateRange: customDateRange
					? {
							from: customDateRange.from ?? null,
							to: customDateRange.to ?? null,
						}
					: undefined,
			}),
		[SelectedDuration, customDateRange],
	);
	//Stable key so date-dependent effects only refire on a real date change.
	const dateKey = useMemo(() => JSON.stringify(dateParams), [dateParams]);

	//The currently selected user option (keyed by userId+userType).
	const selectedUser = useMemo(
		() =>
			userOptions.find((user) => userOptionKey(user) === selectedUserKey),
		[userOptions, selectedUserKey],
	);

	//Reset selections + cached option lists whenever the scope or date window
	//changes, so stale picks/options don't leak across engines or time ranges. The
	//options themselves are (re)fetched lazily the next time a dropdown is opened.
	useEffect(() => {
		if (!didInitializeRef.current) {
			didInitializeRef.current = true;
			lastScopeKeyRef.current = scopeKey;
			return;
		}
		const scopeChanged = lastScopeKeyRef.current !== scopeKey;
		setSelectedMethods([]);
		setSelectedEngineTypes([]);
		setSelectedRoomId("");
		if (scopeChanged) {
			setSelectedUserKey("");
			setOwnerStatus("unknown");
		}
		setMethodOptions([]);
		setEngineTypeOptions([]);
		setRoomOptions([]);
		setUserOptions([]);
		loadedKeyRef.current = {};
		lastScopeKeyRef.current = scopeKey;
	}, [scopeKey, dateKey]);

	//Fetch a single option list on demand (when its dropdown opens), caching by
	//scope+date so we don't refetch on every open. runPixel resolves even on
	//pixel-level errors, so surface those instead of silently showing "no values".
	const ensureSimpleOptions = (
		filterName: "methodName" | "engineType" | "roomId",
		setOptions: (options: string[]) => void,
	) => {
		if (
			!hasScope(effectiveScope) ||
			!effectiveScope ||
			(!runFilterPixel && !insightId)
		) {
			return;
		}
		const key = `${scopeKey}|${dateKey}`;
		if (loadedKeyRef.current[filterName] === key) return;
		loadedKeyRef.current[filterName] = key;
		setLoadingFilters((prev) => ({ ...prev, [filterName]: true }));
		executeFilterPixel(
			buildFilterOptionListPixel({
				filterName,
				scope: effectiveScope,
				date: hideDateFilter ? undefined : dateParams,
			}),
		)
			.then((response) => {
				const result = response.pixelReturn[0];
				if (result.operationType?.indexOf("ERROR") > -1) {
					console.error(
						`Audit log ${filterName} option list returned an error:`,
						result.output,
					);
				}
				setOptions(parseSimpleFilterOptions(result.output));
			})
			.catch((error) => {
				loadedKeyRef.current[filterName] = ""; //allow a retry on next open
				setOptions([]);
				console.error(
					`Error loading audit log ${filterName} options:`,
					error,
				);
			})
			.finally(() =>
				setLoadingFilters((prev) => ({ ...prev, [filterName]: false })),
			);
	};

	//Fetch the owner-only user option list on demand (when its dropdown opens).
	const ensureUserOptions = async () => {
		if (
			!hasScope(effectiveScope) ||
			!effectiveScope ||
			effectiveScope.roomId ||
			(!runFilterPixel && !insightId)
		) {
			return;
		}
		const key = `${scopeKey}|${dateKey}`;
		if (loadedKeyRef.current.user === key) return;
		setLoadingFilters((prev) => ({ ...prev, user: true }));
		try {
			let resolvedOwnerStatus = ownerStatus;
			if (resolvedOwnerStatus === "unknown") {
				let permission: string | undefined;
				if (effectiveScope.projectId) {
					permission = await getUserProjectPermission(
						effectiveScope.projectId,
					);
				} else if (effectiveScope.engineId) {
					permission = await getUserEnginePermission(
						effectiveScope.engineId,
					);
				}
				resolvedOwnerStatus =
					permission === "OWNER" ? "owner" : "non-owner";
				setOwnerStatus(resolvedOwnerStatus);
			}
			if (resolvedOwnerStatus !== "owner") {
				loadedKeyRef.current.user = key;
				setUserOptions([]);
				return;
			}
			loadedKeyRef.current.user = key;
			const response = await executeFilterPixel(
				buildFilterOptionListPixel({
					filterName: "user",
					scope: effectiveScope,
					date: hideDateFilter ? undefined : dateParams,
				}),
			);
			setUserOptions(
				parseUserFilterOptions(response.pixelReturn[0].output),
			);
		} catch (error) {
			loadedKeyRef.current.user = "";
			setUserOptions([]);
			console.error("Error loading audit log user options:", error);
		} finally {
			setLoadingFilters((prev) => ({ ...prev, user: false }));
		}
	};

	//Debounce the global search input so we don't refetch on every keystroke.
	useEffect(() => {
		const handle = setTimeout(() => setSearchTerm(searchInput), 400);
		return () => clearTimeout(handle);
	}, [searchInput]);

	//Emit the full filter value whenever anything changes (once a scope exists).
	useEffect(() => {
		if (!hasScope(effectiveScope)) {
			lastEmittedFilterKeyRef.current = "";
			return;
		}
		const nextFilterValue = {
			scope: effectiveScope,
			dateRangeType: SelectedDuration.dateRangeType,
			dateRangeValue: SelectedDuration.dateRangeValue,
			customDateRange: {
				from: customDateRange?.from ?? null,
				to: customDateRange?.to ?? null,
			},
			methodNames: selectedMethods,
			engineTypes: selectedEngineTypes,
			filterUserId:
				ownerStatus === "owner" ? (selectedUser?.userId ?? "") : "",
			roomId: selectedRoomId,
			searchTerm,
		};
		const nextFilterKey = JSON.stringify(nextFilterValue);
		if (lastEmittedFilterKeyRef.current === nextFilterKey) return;
		lastEmittedFilterKeyRef.current = nextFilterKey;
		updateLogs(nextFilterValue);
	}, [
		scopeKey,
		SelectedDuration.dateRangeType,
		SelectedDuration.dateRangeValue,
		customDateRange,
		selectedMethods,
		selectedEngineTypes,
		selectedUser,
		selectedRoomId,
		searchTerm,
		ownerStatus,
	]);

	//Calendar content shown under the date dropdown when "Custom" is selected.
	const customDateContent = (
		<div className="flex w-[320px] max-w-[90vw] flex-col gap-4">
			<div className="flex justify-between gap-2">
				<Input
					value={dateFormat(customDateRange?.from?.toString())}
					type="text"
					className="w-[50%]"
				></Input>
				<Input
					value={dateFormat(customDateRange?.to?.toString())}
					type="text"
					className="w-[50%]"
				></Input>
			</div>
			<div className="flex justify-around">
				<Calendar
					mode="range"
					selected={customDateRange ?? undefined}
					onSelect={(daterange) => {
						if (daterange?.from && daterange?.to) {
							setCustomDateRange(daterange);
						}
					}}
					className="rounded-md border shadow-sm"
					captionLayout="dropdown"
					timeZone="UTC"
					disabled={{
						after: new Date(new Date().toUTCString()),
					}}
				/>
			</div>
			<div className="flex justify-between">
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setDateOpen(false);
					}}
				>
					{t("filter.close")}
				</Button>
				<Button
					variant="outline"
					className="w-fit justify-end bg-primary text-white"
					size="sm"
					onClick={() => {
						setDateOpen(false);
					}}
				>
					{t("filter.apply")}
				</Button>
			</div>
		</div>
	);

	const scopeReady = hasScope(effectiveScope);
	const supportsUserFilter = Boolean(
		effectiveScope && !effectiveScope.roomId,
	);
	//Filter selections only — the scope pickers (engine type/engine) are left alone
	//since clearing them would empty the table entirely.
	const hasActiveFilters =
		selectedMethods.length > 0 ||
		selectedEngineTypes.length > 0 ||
		selectedUserKey !== "" ||
		searchInput !== "" ||
		selectedRoomId !== "" ||
		dashboardDuration !== "";

	const clearAllFilters = () => {
		setSelectedMethods([]);
		setSelectedEngineTypes([]);
		setSelectedUserKey("");
		setSearchInput("");
		setSearchTerm("");
		setSelectedRoomId("");
		setDashboardDuration("");
		setDateOpen(false);
		setCustomDateRange({ from: new Date(), to: new Date() });
	};

	return (
		<div className="flex w-full flex-wrap items-center gap-2">
			{/** unified compact toolbar: search + filters + actions */}
			<div className="relative flex w-[200px] items-center">
				<Search className="absolute start-2 size-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder={t("filter.searchPlaceholder")}
					value={searchInput}
					onChange={(event) => setSearchInput(event.target.value)}
					disabled={!scopeReady}
					className="h-8 w-full ps-8"
				/>
			</div>

			{/** scope pickers: only rendered when the scope isn't fixed by the route */}
			{!parent && (
				<>
					<div className="flex min-w-[100px] justify-between">
						<DropdownMenu>
							<DropdownMenuTrigger
								asChild
								className="flex w-[150px] justify-between align-center"
							>
								<Button
									variant="outline"
									size="sm"
									className={`flex justify-between self-center`}
								>
									<div className="flex w-full justify-between self-center">
										<span className="flex justify-start">
											{engineSelectionDetails.engineType !==
											""
												? engineSelectionDetails.engineType
												: t(
														"filter.selectEngineType",
													)}{" "}
										</span>
										<ChevronDownIcon className="flex justify-end self-center" />
									</div>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuRadioGroup>
									{ENGINE_TYPES.map((engineType) => (
										<DropdownMenuCheckboxItem
											checked={
												engineType ===
												engineSelectionDetails.engineType
											}
											key={`${engineType}Selection`}
											onCheckedChange={(open) => {
												setEngineSelectionDetails({
													...engineSelectionDetails,
													engineType: open
														? engineType
														: "",
													engineId: "",
												});
											}}
										>
											{engineType}
										</DropdownMenuCheckboxItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div className="flex min-w-[100px] justify-between">
						<DropdownMenu>
							<DropdownMenuTrigger
								asChild
								className="flex w-[150px] justify-between align-center"
							>
								<Button
									variant="outline"
									size="sm"
									className={`flex min-w-[150px] justify-between align-center`}
								>
									<div className="flex w-full justify-between">
										<span className="flex justify-start">
											{engineDetails?.[
												engineSelectionDetails
													?.engineType
											]
												?.filter(
													(engine) =>
														engine.value ===
														engineSelectionDetails.engineId,
												)
												.map(
													(engine) => engine.label,
												) ??
												t("filter.selectEngine")}{" "}
										</span>
										<ChevronDownIcon className="flex justify-end self-center" />
									</div>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuRadioGroup>
									{engineSelectionDetails.engineType &&
										engineDetails[
											engineSelectionDetails.engineType
										].length > 0 &&
										engineDetails[
											engineSelectionDetails.engineType
										].map((engine) => (
											<DropdownMenuCheckboxItem
												key={`engine-${engine.value}`}
												checked={
													engine.value ===
													engineSelectionDetails.engineId
												}
												onCheckedChange={(prop) => {
													setEngineSelectionDetails({
														...engineSelectionDetails,
														engineId: prop
															? engine.value
															: "",
													});
												}}
											>
												{engine.label}
											</DropdownMenuCheckboxItem>
										))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</>
			)}

			{/** room id filter (single-select, server-driven options; loaded on open) */}
			{!hideRoomFilter && (
				<DropdownMenu
					onOpenChange={(open) => {
						if (open) ensureSimpleOptions("roomId", setRoomOptions);
					}}
				>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							disabled={!scopeReady}
							className="flex w-[150px] justify-between self-center"
						>
							<span className="truncate">
								{selectedRoomId || t("filter.roomId")}
							</span>
							<ChevronDownIcon className="ms-2 size-4 shrink-0" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="max-h-[300px] overflow-y-auto">
						<DropdownMenuCheckboxItem
							checked={selectedRoomId === ""}
							onCheckedChange={() => setSelectedRoomId("")}
							onSelect={(event) => event.preventDefault()}
						>
							{t("filter.allRooms")}
						</DropdownMenuCheckboxItem>
						{loadingFilters.roomId ? (
							<div className="px-2 py-1.5 text-muted-foreground text-sm">
								{t("filter.loading")}
							</div>
						) : (
							roomOptions.map((room) => (
								<DropdownMenuCheckboxItem
									key={`room-${room}`}
									checked={selectedRoomId === room}
									onCheckedChange={(checked) =>
										setSelectedRoomId(checked ? room : "")
									}
									onSelect={(event) => event.preventDefault()}
								>
									{room}
								</DropdownMenuCheckboxItem>
							))
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			)}

			{/** method name filter (server-side, multi-select; loaded on open) */}
			<MultiSelectDropdown
				label={t("filter.methodName")}
				options={methodOptions}
				selected={selectedMethods}
				onChange={setSelectedMethods}
				onOpen={() =>
					ensureSimpleOptions("methodName", setMethodOptions)
				}
				loading={loadingFilters.methodName}
				disabled={!scopeReady}
			/>

			{/** engine type filter (server-side, multi-select; loaded on open) */}
			<MultiSelectDropdown
				label={t("filter.engineType")}
				options={engineTypeOptions}
				selected={selectedEngineTypes}
				onChange={setSelectedEngineTypes}
				onOpen={() =>
					ensureSimpleOptions("engineType", setEngineTypeOptions)
				}
				loading={loadingFilters.engineType}
				disabled={!scopeReady}
			/>

			{/** user filter (loaded on open; ownership resolved lazily) */}
			{supportsUserFilter && ownerStatus !== "non-owner" && (
				<DropdownMenu
					onOpenChange={(open) => {
						if (open) void ensureUserOptions();
					}}
				>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							disabled={!scopeReady}
							className="flex w-[150px] justify-between self-center"
						>
							<span className="truncate">
								{selectedUser
									? selectedUser.userName
									: t("filter.allUsers")}
							</span>
							<ChevronDownIcon className="ms-2 size-4 shrink-0" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="max-h-[300px] overflow-y-auto">
						<DropdownMenuCheckboxItem
							checked={selectedUserKey === ""}
							onCheckedChange={() => setSelectedUserKey("")}
							onSelect={(event) => event.preventDefault()}
						>
							{t("filter.allUsers")}
						</DropdownMenuCheckboxItem>
						{loadingFilters.user && (
							<div className="px-2 py-1.5 text-muted-foreground text-sm">
								{t("filter.loading")}
							</div>
						)}
						{userOptions.map((user) => {
							const key = userOptionKey(user);
							return (
								<DropdownMenuCheckboxItem
									key={`user-${key}`}
									checked={selectedUserKey === key}
									onCheckedChange={(checked) =>
										setSelectedUserKey(checked ? key : "")
									}
									onSelect={(event) => event.preventDefault()}
								>
									{user.userName || user.userId}
									{user.userType ? (
										<span className="ms-2 text-muted-foreground text-xs">
											{user.userType}
										</span>
									) : null}
								</DropdownMenuCheckboxItem>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			)}

			{/** date range — a single popover holds the presets and, for "Custom",
			 * the calendar; using one surface avoids the dropdown→popover conflict
			 * that closed the calendar immediately. */}
			{!hideDateFilter && (
				<Popover open={dateOpen} onOpenChange={setDateOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="flex w-[150px] justify-between self-center"
						>
							<span className="truncate">
								{SelectedDuration?.labelKey === ""
									? t("filter.dateRange.today")
									: t(SelectedDuration.labelKey)}
							</span>
							<ChevronDownIcon className="ms-2 size-4 shrink-0" />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						align="end"
						side="bottom"
						sideOffset={6}
						collisionPadding={8}
						className="max-h-[var(--radix-popover-content-available-height)] w-auto overflow-y-auto p-2"
					>
						<div className="flex flex-col gap-1">
							{DashboardDurations.map((duration) => (
								<React.Fragment
									key={`duration-${duration.value}`}
								>
									{"renderWithSeparator" in duration &&
										duration.renderWithSeparator && (
											<div className="my-1 border-t" />
										)}
									<Button
										variant={
											duration.value === dashboardDuration
												? "secondary"
												: "ghost"
										}
										size="sm"
										className="w-full justify-start font-normal"
										onClick={() => {
											setDashboardDuration(
												duration.value,
											);
											//Keep the popover open for Custom so the
											//calendar shows; close it for presets.
											if (duration.value !== "custom") {
												setDateOpen(false);
											}
										}}
									>
										{t(duration.labelKey)}
									</Button>
								</React.Fragment>
							))}
						</div>
						{dashboardDuration === "custom" && (
							<div className="mt-2 border-t pt-2">
								{customDateContent}
							</div>
						)}
					</PopoverContent>
				</Popover>
			)}

			{/** clear every filter selection (scope pickers excluded) */}
			{hasActiveFilters && (
				<Button
					variant="ghost"
					size="sm"
					onClick={clearAllFilters}
					className="text-muted-foreground"
				>
					<X className="me-1 size-4" />
					{t("filter.clearFilters")}
				</Button>
			)}
			{actions ? (
				<div className="ms-auto flex shrink-0 items-center gap-2">
					{actions}
				</div>
			) : null}
		</div>
	);
};
