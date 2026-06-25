import {
	CircleX as Cancel,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CircleCheck as CircleCheckIcon,
} from "lucide-react"; // Example icons
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { AuditLogsDetailDrawer } from "./audit-logs-detail-drawer";
import type { EventData } from "./common";
import { TimeDateFormatter } from "./common";

//table data props
interface AuditLogsDataTableProps {
	logs: EventData[];
	totalCount?: number;
	page: number;
	rowsPerPage: number;
	onPaginationChange: (page: number, rowsPerPage: number) => void;
}
//Row grouping mirrors the timeline: ungrouped, or one collapsible group per
//spanId / requestId. Grouping is client-side over the current page (the same set
//the timeline groups), since filtering + pagination are server-side.
type RowGroupMode = "none" | "span" | "request";
const GROUP_MODE_LABEL_KEYS: Record<RowGroupMode, string> = {
	none: "table.grouping.none",
	span: "table.grouping.span",
	request: "table.grouping.request",
};
const TABLE_COLUMN_COUNT = 11;
//Matches the timeline: success is truthy and not the string "false".
const isSuccess = (status: EventData["status"]) =>
	Boolean(status) && status !== "false";
//truncate text when maxlength is reached
const ellipsed = (text: string | null | undefined, maxLength = 50) => {
	if (!text) return "";
	return text.length > maxLength
		? `${text.substring(0, maxLength - 3)}...`
		: text;
};
//handling table data and work with table related events. Filtering and search are
//performed server-side (see AuditLogFilter + AuditLogsReport); this component only
//renders the current page and drives server-side pagination.
export const AuditLogsDataTable: React.FC<AuditLogsDataTableProps> = ({
	logs = [],
	totalCount = 0,
	page,
	rowsPerPage,
	onPaginationChange,
}) => {
	const { t } = useTranslation("auditlog");
	const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null); //setting event when row clicked, and event will have all the rowdata
	const [drawerOpen, setDrawerOpen] = useState(false); //drawer show or close
	const [groupMode, setGroupMode] = useState<RowGroupMode>("none");
	//Collapsed group keys (default = expanded, so rows stay visible when grouping on).
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		() => new Set(),
	);

	//Build the groups for the current page when grouping is on, preserving
	//first-appearance order and rolling up count / latency / tokens / status.
	const groups = useMemo(() => {
		if (groupMode === "none") return null;
		const keyOf = (event: EventData) =>
			groupMode === "request"
				? event.requestId || "—"
				: event.spanId || "—";
		const order: string[] = [];
		const byKey = new Map<string, EventData[]>();
		for (const event of logs) {
			const key = keyOf(event);
			if (!byKey.has(key)) {
				byKey.set(key, []);
				order.push(key);
			}
			byKey.get(key)?.push(event);
		}
		return order.map((key) => {
			const events = byKey.get(key) ?? [];
			return {
				key,
				events,
				totalLatency: events.reduce(
					(sum, e) => sum + (Number(e.latency) || 0),
					0,
				),
				totalTokens: events.reduce(
					(sum, e) => sum + (Number(e.tokens) || 0),
					0,
				),
				hasFailure: events.some((e) => !isSuccess(e.status)),
			};
		});
	}, [logs, groupMode]);

	const toggleGroup = useCallback((key: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	}, []);

	//onclick drawer has to open, it is handled here
	const handleRowClick = useCallback((event: EventData) => {
		setSelectedEvent(event);
		setDrawerOpen(true);
	}, []);
	//handle drawer close by setting timeout
	const handleDrawerClose = useCallback(() => {
		setDrawerOpen(false);
		setTimeout(() => {
			setSelectedEvent(null);
		}, 300);
	}, []);

	//handle rows per page dropdown value
	const handleChangeRowsPerPage = useCallback(
		(value: string) => {
			const newRowsPerPage = parseInt(value, 10);
			onPaginationChange(0, newRowsPerPage);
		},
		[onPaginationChange],
	);

	//A single event row. `indent` left-pads the first cell when shown under a group.
	const renderEventRow = (
		event: EventData,
		index: number,
		indent = false,
	) => (
		<TableRow
			key={`Log-${event.requestId ?? event.endTime}-${index}`}
			className="cursor-pointer hover:[background-color:rgb(245,249,254)!important] [a&]:hover:bg-primary"
			onClick={() => handleRowClick(event)}
		>
			<TableCell className={indent ? "pl-8" : undefined}>
				<span title={event.userId} className="text-sm">
					{ellipsed(event.userName || event.userId, 23)}
				</span>
			</TableCell>
			<TableCell>
				<span title={event.sessionId} className="text-sm">
					{ellipsed(event.sessionId, 23)}
				</span>
			</TableCell>
			<TableCell>
				<span title={event.request} className="text-sm">
					{ellipsed(event.request)}
				</span>
			</TableCell>
			<TableCell>
				<span title={event.response} className="text-sm">
					{ellipsed(event.response)}
				</span>
			</TableCell>
			<TableCell>
				<span title={event.methodName} className="text-sm">
					{event.methodName}
				</span>
			</TableCell>
			<TableCell>
				<span className="text-sm">{event.engineType}</span>
			</TableCell>
			<TableCell>
				<span className="text-sm">{event.engineName}</span>
			</TableCell>
			<TableCell>
				<span className="text-sm">{event.latency}ms</span>
			</TableCell>
			<TableCell>
				<span className="text-sm">{event.tokens}</span>
			</TableCell>
			<TableCell>
				<span className="text-xs">{`${TimeDateFormatter(event.startTime).time} - ${TimeDateFormatter(event.endTime).time}`}</span>
			</TableCell>
			<TableCell className="text-center">
				{isSuccess(event.status) ? (
					<CircleCheckIcon
						className="inline-block h-4 w-4"
						color="#2e7d32"
					/>
				) : (
					<Cancel className="inline-block h-4 w-4" color="#da291c" />
				)}
			</TableCell>
		</TableRow>
	);

	const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
	const firstRow = totalCount === 0 ? 0 : page * rowsPerPage + 1;
	const lastRow = Math.min((page + 1) * rowsPerPage, totalCount);

	// Empty State
	if (!logs || logs.length === 0) {
		return (
			<div className="mt-4 rounded-lg border bg-white shadow">
				<div className="flex items-center justify-between p-4">
					<span className="font-semibold text-lg">
						{t("table.title")}
					</span>
				</div>
				<div className="flex items-center justify-center border-b p-4">
					<span className="text-gray-500">{t("common.noLogs")}</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mt-4 rounded-lg border bg-white shadow">
				<div className="flex items-center justify-between p-4">
					<span className="font-semibold text-lg">
						{t("table.title")}
					</span>
					<Select
						value={groupMode}
						onValueChange={(value) =>
							setGroupMode(value as RowGroupMode)
						}
					>
						<SelectTrigger className="h-8 w-[160px] text-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{(
								Object.keys(
									GROUP_MODE_LABEL_KEYS,
								) as RowGroupMode[]
							).map((mode) => (
								<SelectItem key={mode} value={mode}>
									{t(GROUP_MODE_LABEL_KEYS[mode])}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="border-b p-4">
					<Table>
						<TableHeader>
							<TableRow style={{ backgroundColor: "#F5F9FE" }}>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.user")}
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.sessionId")}
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.request")}
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.response")}
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.method")}
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.engineType")}
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.engineName")}
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.latency")}
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.tokens")}
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.timestamp")}
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										{t("table.columns.status")}
									</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{groups
								? groups.flatMap((group) => {
										const collapsed = collapsedGroups.has(
											group.key,
										);
										const rows = [
											<TableRow
												key={`group-${group.key}`}
												className="cursor-pointer bg-[#F5F9FE] hover:[background-color:rgb(236,243,252)!important]"
												onClick={() =>
													toggleGroup(group.key)
												}
											>
												<TableCell
													colSpan={TABLE_COLUMN_COUNT}
												>
													<div className="flex items-center gap-2">
														{collapsed ? (
															<ChevronRight className="rtl:-scale-x-100 h-4 w-4 shrink-0 text-gray-500" />
														) : (
															<ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
														)}
														<span className="font-semibold text-primary text-sm">
															{groupMode ===
															"request"
																? t(
																		"table.groupRequest",
																	)
																: t(
																		"table.groupSpan",
																	)}
														</span>
														<span
															title={group.key}
															className="font-mono text-gray-700 text-sm"
														>
															{ellipsed(
																group.key,
																32,
															)}
														</span>
														<span className="ml-2 text-gray-500 text-xs">
															{t("table.event", {
																count: group
																	.events
																	.length,
															})}{" "}
															·{" "}
															{t(
																"table.groupMeta",
																{
																	latency:
																		group.totalLatency,
																	tokens: group.totalTokens,
																},
															)}
														</span>
														{group.hasFailure ? (
															<Cancel
																className="h-4 w-4 shrink-0"
																color="#da291c"
															/>
														) : (
															<CircleCheckIcon
																className="h-4 w-4 shrink-0"
																color="#2e7d32"
															/>
														)}
													</div>
												</TableCell>
											</TableRow>,
										];
										if (!collapsed) {
											group.events.forEach(
												(event, index) => {
													rows.push(
														renderEventRow(
															event,
															index,
															true,
														),
													);
												},
											);
										}
										return rows;
									})
								: logs.map((event, index) =>
										renderEventRow(event, index),
									)}
						</TableBody>
					</Table>
				</div>
				{/* Server-side pagination */}
				<div className="flex items-center gap-2 justify-self-end bg-white p-2">
					<label
						htmlFor="rows-per-page"
						className="font-medium text-gray-700 text-sm"
					>
						{t("table.rowsPerPage")}
					</label>
					<Select
						value={rowsPerPage.toString()}
						onValueChange={(value: string) => {
							handleChangeRowsPerPage(value);
						}}
					>
						<SelectTrigger
							id={"rows-per-page"}
							className="w-[80px] border-transparent text-sm"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{["50", "100", "200", "500"].map((opt) => (
								<SelectItem key={opt} value={opt}>
									{opt}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<span className="mx-2 text-sm">
						{t("table.pageRange", {
							first: firstRow,
							last: lastRow,
							total: totalCount,
						})}
					</span>
					<Button
						variant="ghost"
						disabled={page === 0}
						onClick={() =>
							onPaginationChange(page - 1, rowsPerPage)
						}
					>
						<ChevronLeft className="rtl:-scale-x-100" />
					</Button>
					<Button
						variant="ghost"
						disabled={page + 1 >= totalPages}
						onClick={() =>
							onPaginationChange(page + 1, rowsPerPage)
						}
					>
						<ChevronRight className="rtl:-scale-x-100" />
					</Button>
				</div>
			</div>

			<div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
				<span className="text-gray-500 text-sm">
					{t("table.showingResults", {
						shown: logs.length,
						total: totalCount,
					})}
				</span>
			</div>
			{/** sheet open/close when user clicks on the row in auditlog table */}
			<Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
				<SheetContent
					side="right"
					className="min-w-[500px] transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
				>
					<SheetTitle className="sr-only">
						{t("detail.title")}
					</SheetTitle>
					<AuditLogsDetailDrawer
						logDetails={selectedEvent}
						handleDrawerClose={handleDrawerClose}
					/>
				</SheetContent>
			</Sheet>
		</>
	);
};
