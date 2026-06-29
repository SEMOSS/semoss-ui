import {
	ChevronLeft,
	ChevronRight,
	Plus,
	RefreshCcw,
	Save,
	Search,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
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
	toast,
} from "@semoss/ui/next";
import { getAllUsers } from "@/api";
import { useRootStore } from "@/hooks";

type QueryPeriod = "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR" | "ALL_TIME";

interface QueryLimitRow {
	id: string;
	userId: string | null;
	userName?: string;
	userEmail?: string;
	usageFrequency: QueryPeriod;
	maxRequests: number | null;
	isActive: boolean;
	_saved: {
		usageFrequency: QueryPeriod;
		maxRequests: number | null;
		isActive: boolean;
	};
}

interface UserOption {
	id: string;
	type: string;
	name?: string;
	email?: string;
	username?: string;
}

const PERIODS: QueryPeriod[] = [
	"HOUR",
	"DAY",
	"WEEK",
	"MONTH",
	"YEAR",
	"ALL_TIME",
];

const PERIOD_LABELS: Record<QueryPeriod, string> = {
	HOUR: "Per Hour",
	DAY: "Per Day",
	WEEK: "Per Week",
	MONTH: "Per Month",
	YEAR: "Per Year",
	ALL_TIME: "All Time",
};

const ROWS_PER_PAGE = 8;

const escapePixelString = (value: string) =>
	value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, "");

const parseNullableNumber = (value: string) => {
	if (value.trim() === "") {
		return null;
	}
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? null : parsed;
};

const normalizePeriod = (value: unknown): QueryPeriod =>
	PERIODS.includes(String(value).toUpperCase() as QueryPeriod)
		? (String(value).toUpperCase() as QueryPeriod)
		: "HOUR";

const buildRowId = (userId: string | null, period: QueryPeriod) =>
	`${userId ?? "DEFAULT"}::${period}`;

const rowIsDirty = (row: QueryLimitRow) =>
	row.usageFrequency !== row._saved.usageFrequency ||
	row.maxRequests !== row._saved.maxRequests ||
	row.isActive !== row._saved.isActive;

const getPixelOutput = <T,>(response: unknown): T => {
	const pixelReturn = (response as { pixelReturn?: { output: T }[] })
		.pixelReturn;
	return pixelReturn?.[0]?.output as T;
};

const createDraftRow = (
	userId: string | null,
	period: QueryPeriod,
	user?: UserOption,
): QueryLimitRow => ({
	id: `draft-${userId ?? "DEFAULT"}-${period}-${Date.now()}`,
	userId,
	userName: user?.name || user?.username || userId || undefined,
	userEmail: user?.email,
	usageFrequency: period,
	maxRequests: null,
	isActive: true,
	_saved: {
		usageFrequency: period,
		maxRequests: null,
		isActive: true,
	},
});

export const QueryRateLimitsPage = () => {
	const { monolithStore } = useRootStore();
	const [loading, setLoading] = useState(true);
	const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
	const [limits, setLimits] = useState<QueryLimitRow[]>([]);
	const [draftsById, setDraftsById] = useState<Record<string, QueryLimitRow>>(
		{},
	);
	const [newDefaultRow, setNewDefaultRow] = useState<QueryLimitRow | null>(
		null,
	);
	const [newUserRows, setNewUserRows] = useState<QueryLimitRow[]>([]);
	const [userDialogOpen, setUserDialogOpen] = useState(false);
	const [userSearch, setUserSearch] = useState("");
	const [userPage, setUserPage] = useState(0);
	const [userLoading, setUserLoading] = useState(false);
	const [userOptions, setUserOptions] = useState<UserOption[]>([]);
	const [filteredUsers, setFilteredUsers] = useState(0);

	const loadLimits = useCallback(async () => {
		setLoading(true);
		try {
			const response = await monolithStore.runQuery(
				"AdminGetQueryRateLimits();",
			);
			const output =
				getPixelOutput<Record<string, unknown>[] | undefined>(
					response,
				) ?? [];
			setLimits(
				output.map((row) => {
					const userId = (row.userId as string | null) ?? null;
					const period = normalizePeriod(row.usageFrequency);
					const maxRequests =
						typeof row.maxRequests === "number" &&
						row.maxRequests >= 0
							? row.maxRequests
							: row.maxRequests == null ||
									Number(row.maxRequests) < 0
								? null
								: Number(row.maxRequests);
					const isActive = row.isActive !== false;
					return {
						id: buildRowId(userId, period),
						userId,
						userName: row.userName as string | undefined,
						userEmail: row.userEmail as string | undefined,
						usageFrequency: period,
						maxRequests,
						isActive,
						_saved: {
							usageFrequency: period,
							maxRequests,
							isActive,
						},
					};
				}),
			);
			setDraftsById({});
		} catch (error) {
			toast.error(String(error));
		} finally {
			setLoading(false);
		}
	}, [monolithStore]);

	useEffect(() => {
		loadLimits();
	}, [loadLimits]);

	useEffect(() => {
		if (!userDialogOpen) {
			return;
		}

		let cancelled = false;
		const timer = window.setTimeout(async () => {
			setUserLoading(true);
			try {
				const result = await getAllUsers(
					true,
					userSearch,
					userPage * ROWS_PER_PAGE,
					ROWS_PER_PAGE,
				);
				if (!cancelled && result) {
					setUserOptions(result.users as UserOption[]);
					setFilteredUsers(result.filteredUsers ?? 0);
				}
			} catch (error) {
				if (!cancelled) {
					toast.error(String(error));
				}
			} finally {
				if (!cancelled) {
					setUserLoading(false);
				}
			}
		}, 250);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [userDialogOpen, userPage, userSearch]);

	const displayedLimits = useMemo(
		() => limits.map((limit) => draftsById[limit.id] ?? limit),
		[draftsById, limits],
	);

	const defaultLimits = displayedLimits.filter((row) => row.userId == null);
	const userLimits = displayedLimits.filter((row) => row.userId != null);
	const existingDefaultPeriods = defaultLimits.map(
		(row) => row.usageFrequency,
	);
	const remainingDefaultPeriods = PERIODS.filter(
		(period) => !existingDefaultPeriods.includes(period),
	);
	const userRows = [...userLimits, ...newUserRows].sort((a, b) =>
		(a.userName || a.userId || "").localeCompare(
			b.userName || b.userId || "",
		),
	);

	const saveRow = async (row: QueryLimitRow) => {
		setSavingIds((prev) => new Set(prev).add(row.id));
		try {
			const userArg = row.userId
				? `userId=["${escapePixelString(row.userId)}"], `
				: "";
			await monolithStore.runQuery(
				`AdminSetQueryRateLimit(${userArg}usageFrequency=["${row.usageFrequency}"], maxRequests=[${row.maxRequests ?? -1}], isActive=[${row.isActive}]);`,
			);
			toast.success("Query limit saved");
			await loadLimits();
			setNewDefaultRow(null);
			setNewUserRows((prev) =>
				prev.filter((candidate) => candidate.id !== row.id),
			);
			return true;
		} catch (error) {
			toast.error(String(error));
			return false;
		} finally {
			setSavingIds((prev) => {
				const next = new Set(prev);
				next.delete(row.id);
				return next;
			});
		}
	};

	const deleteRow = async (row: QueryLimitRow) => {
		if (row.id.startsWith("draft-")) {
			if (row.userId == null) {
				setNewDefaultRow(null);
			} else {
				setNewUserRows((prev) =>
					prev.filter((candidate) => candidate.id !== row.id),
				);
			}
			return;
		}

		setSavingIds((prev) => new Set(prev).add(row.id));
		try {
			const userArg = row.userId
				? `userId=["${escapePixelString(row.userId)}"], `
				: "";
			await monolithStore.runQuery(
				`AdminRemoveQueryRateLimit(${userArg}usageFrequency=["${row._saved.usageFrequency}"]);`,
			);
			toast.success("Query limit removed");
			await loadLimits();
		} catch (error) {
			toast.error(String(error));
		} finally {
			setSavingIds((prev) => {
				const next = new Set(prev);
				next.delete(row.id);
				return next;
			});
		}
	};

	const updateExistingRow = (row: QueryLimitRow) => {
		setDraftsById((prev) => ({ ...prev, [row.id]: row }));
	};

	const addUserOverride = (user: UserOption) => {
		const existingPeriods = [...limits, ...newUserRows]
			.filter((row) => row.userId === user.id)
			.map((row) => row.usageFrequency);
		const nextPeriod = PERIODS.find(
			(period) => !existingPeriods.includes(period),
		);
		if (!nextPeriod) {
			toast.error("All periods are already configured for this user");
			return;
		}
		setNewUserRows((prev) => [
			...prev,
			createDraftRow(user.id, nextPeriod, user),
		]);
		setUserDialogOpen(false);
	};

	const totalPages = Math.max(1, Math.ceil(filteredUsers / ROWS_PER_PAGE));

	if (loading) {
		return (
			<div className="flex w-full items-center justify-center py-12">
				<Spinner className="size-6" />
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="font-semibold text-lg">Query Rate Limits</h2>
					<p className="text-muted-foreground text-sm">
						Configure request-count limits by time period.
					</p>
				</div>
				<Button variant="outline" size="sm" onClick={loadLimits}>
					<RefreshCcw className="mr-2 size-4" />
					Refresh
				</Button>
			</div>

			<section className="rounded-xl border">
				<div className="flex items-start justify-between gap-3 border-b px-4 py-3">
					<div>
						<h3 className="font-semibold text-base">
							Default User Limits
						</h3>
						<p className="text-muted-foreground text-sm">
							Defaults apply when a user does not have an override
							for the same period.
						</p>
					</div>
					<Button
						size="sm"
						disabled={
							!!newDefaultRow ||
							remainingDefaultPeriods.length === 0
						}
						onClick={() =>
							setNewDefaultRow(
								createDraftRow(
									null,
									remainingDefaultPeriods[0],
								),
							)
						}
					>
						<Plus className="mr-1 size-3" /> Add Limit
					</Button>
				</div>
				<div className="flex flex-col gap-2 p-4">
					{newDefaultRow && (
						<QueryLimitEditorRow
							row={newDefaultRow}
							usedPeriods={existingDefaultPeriods}
							onChange={(next) => setNewDefaultRow(next)}
							onSave={saveRow}
							onDelete={deleteRow}
							disabled={savingIds.has(newDefaultRow.id)}
						/>
					)}
					{defaultLimits.map((row) => (
						<QueryLimitEditorRow
							key={row.id}
							row={row}
							usedPeriods={defaultLimits.map(
								(limit) => limit.usageFrequency,
							)}
							onChange={updateExistingRow}
							onSave={saveRow}
							onDelete={deleteRow}
							disabled={savingIds.has(row.id)}
						/>
					))}
					{defaultLimits.length === 0 && !newDefaultRow && (
						<p className="py-4 text-center text-muted-foreground text-sm">
							No default query limits configured.
						</p>
					)}
				</div>
			</section>

			<section className="rounded-xl border">
				<div className="flex items-start justify-between gap-3 border-b px-4 py-3">
					<div>
						<h3 className="font-semibold text-base">
							User Overrides
						</h3>
						<p className="text-muted-foreground text-sm">
							User rows override the default for the same period.
						</p>
					</div>
					<Button size="sm" onClick={() => setUserDialogOpen(true)}>
						<Plus className="mr-1 size-3" /> Add User
					</Button>
				</div>
				<div className="flex flex-col gap-3 p-4">
					{userRows.map((row) => (
						<div key={row.id} className="rounded-lg border p-3">
							<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
								<div>
									<p className="font-medium text-sm">
										{row.userName || row.userId}
									</p>
									<p className="text-muted-foreground text-xs">
										{row.userEmail || row.userId}
									</p>
								</div>
							</div>
							<QueryLimitEditorRow
								row={row}
								usedPeriods={userRows
									.filter(
										(limit) => limit.userId === row.userId,
									)
									.map((limit) => limit.usageFrequency)}
								onChange={(next) => {
									if (row.id.startsWith("draft-")) {
										setNewUserRows((prev) =>
											prev.map((candidate) =>
												candidate.id === row.id
													? next
													: candidate,
											),
										);
									} else {
										updateExistingRow(next);
									}
								}}
								onSave={saveRow}
								onDelete={deleteRow}
								disabled={savingIds.has(row.id)}
							/>
						</div>
					))}
					{userRows.length === 0 && (
						<p className="py-4 text-center text-muted-foreground text-sm">
							No user overrides configured.
						</p>
					)}
				</div>
			</section>

			<Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add User Override</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3">
						<div className="relative">
							<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
							<Input
								value={userSearch}
								onChange={(e) => {
									setUserSearch(e.target.value);
									setUserPage(0);
								}}
								placeholder="Search users"
								className="pl-9"
							/>
						</div>
						<div className="min-h-[320px] rounded-lg border">
							{userLoading ? (
								<div className="flex h-[320px] items-center justify-center">
									<Spinner className="size-5" />
								</div>
							) : (
								<div className="divide-y">
									{userOptions.map((user) => (
										<button
											key={`${user.id}-${user.type}`}
											type="button"
											className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted"
											onClick={() =>
												addUserOverride(user)
											}
										>
											<div>
												<p className="font-medium text-sm">
													{user.name ||
														user.username ||
														user.id}
												</p>
												<p className="text-muted-foreground text-xs">
													{user.email || user.id}
												</p>
											</div>
											<span className="text-muted-foreground text-xs">
												{user.type}
											</span>
										</button>
									))}
									{userOptions.length === 0 && (
										<p className="py-8 text-center text-muted-foreground text-sm">
											No users found.
										</p>
									)}
								</div>
							)}
						</div>
					</div>
					<DialogFooter className="items-center justify-between sm:justify-between">
						<span className="text-muted-foreground text-xs">
							Page {userPage + 1} of {totalPages}
						</span>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								disabled={userPage === 0}
								onClick={() => setUserPage((page) => page - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								disabled={userPage + 1 >= totalPages}
								onClick={() => setUserPage((page) => page + 1)}
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

function QueryLimitEditorRow({
	row,
	usedPeriods,
	onChange,
	onSave,
	onDelete,
	disabled,
}: {
	row: QueryLimitRow;
	usedPeriods: QueryPeriod[];
	onChange: (row: QueryLimitRow) => void;
	onSave: (row: QueryLimitRow) => Promise<boolean>;
	onDelete: (row: QueryLimitRow) => void | Promise<void>;
	disabled?: boolean;
}) {
	const [requestValue, setRequestValue] = useState(
		row.maxRequests == null ? "" : String(row.maxRequests),
	);
	const periodOptions = PERIODS.filter(
		(period) =>
			period === row.usageFrequency || !usedPeriods.includes(period),
	);
	const dirty = row.id.startsWith("draft-") || rowIsDirty(row);

	useEffect(() => {
		setRequestValue(row.maxRequests == null ? "" : String(row.maxRequests));
	}, [row.maxRequests]);

	return (
		<div className="flex flex-wrap items-center gap-3">
			<div className="flex items-center gap-2">
				<Label className="text-xs">Period:</Label>
				<Select
					value={row.usageFrequency}
					onValueChange={(value) =>
						onChange({
							...row,
							usageFrequency: value as QueryPeriod,
						})
					}
					disabled={disabled}
				>
					<SelectTrigger className="h-8 w-36">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{periodOptions.map((period) => (
							<SelectItem key={period} value={period}>
								{PERIOD_LABELS[period]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex items-center gap-2">
				<Label className="whitespace-nowrap text-xs">Requests:</Label>
				<Input
					type="text"
					inputMode="numeric"
					pattern="[0-9]*"
					value={requestValue}
					onChange={(e) => {
						const nextValue = sanitizeNumericInput(e.target.value);
						setRequestValue(nextValue);
						onChange({
							...row,
							maxRequests: parseNullableNumber(nextValue),
						});
					}}
					disabled={disabled}
					className="h-8 w-24"
				/>
			</div>
			<div className="flex items-center gap-2">
				<Label className="text-xs">Active:</Label>
				<Switch
					checked={row.isActive}
					onCheckedChange={(checked) =>
						onChange({ ...row, isActive: checked })
					}
					disabled={disabled}
				/>
			</div>
			<div className="ml-auto flex items-center gap-1">
				{dirty && (
					<Button
						variant="ghost"
						size="icon"
						className="text-primary"
						disabled={disabled}
						onClick={() => onSave(row)}
						title="Save changes"
					>
						<Save className="size-4" />
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="text-destructive"
					disabled={disabled}
					onClick={() => onDelete(row)}
					title="Remove"
				>
					<Trash2 className="size-4" />
				</Button>
			</div>
		</div>
	);
}
