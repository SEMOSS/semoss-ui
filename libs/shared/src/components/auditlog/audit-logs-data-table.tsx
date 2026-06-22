import {
	CircleX as Cancel,
	ChevronLeft,
	ChevronRight,
	CircleCheck as CircleCheckIcon,
} from "lucide-react"; // Example icons
import { useCallback, useState } from "react";
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
	const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null); //setting event when row clicked, and event will have all the rowdata
	const [drawerOpen, setDrawerOpen] = useState(false); //drawer show or close

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

	const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
	const firstRow = totalCount === 0 ? 0 : page * rowsPerPage + 1;
	const lastRow = Math.min((page + 1) * rowsPerPage, totalCount);

	// Empty State
	if (!logs || logs.length === 0) {
		return (
			<div className="mt-4 rounded-lg border bg-white shadow">
				<div className="flex items-center justify-between p-4">
					<span className="font-semibold text-lg">
						Prompt & Response Timeline
					</span>
				</div>
				<div className="flex items-center justify-center border-b p-4">
					<span className="text-gray-500">No logs available.</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mt-4 rounded-lg border bg-white shadow">
				<div className="flex items-center justify-between p-4">
					<span className="font-semibold text-lg">
						Prompt & Response Timeline
					</span>
				</div>
				<div className="border-b p-4">
					<Table>
						<TableHeader>
							<TableRow style={{ backgroundColor: "#F5F9FE" }}>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										User
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Session Id
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Request
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Response
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Method
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Engine Type
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Engine Name
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Latency
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Tokens
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Timestamp
									</span>
								</TableHead>
								<TableHead>
									<span className="font-medium font-semibold text-primary text-sm leading-6 tracking-normal">
										Status
									</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{logs.map((event, index) => (
								<TableRow
									key={`Log-${event.requestId ?? event.endTime}-${index}`}
									className="cursor-pointer hover:[background-color:rgb(245,249,254)!important] [a&]:hover:bg-primary"
									onClick={() => handleRowClick(event)}
								>
									<TableCell>
										<span
											title={event.userId}
											className="text-sm"
										>
											{ellipsed(
												event.userName || event.userId,
												23,
											)}
										</span>
									</TableCell>
									<TableCell>
										<span
											title={event.sessionId}
											className="text-sm"
										>
											{ellipsed(event.sessionId, 23)}
										</span>
									</TableCell>
									<TableCell>
										<span
											title={event.request}
											className="text-sm"
										>
											{ellipsed(event.request)}
										</span>
									</TableCell>
									<TableCell>
										<span
											title={event.response}
											className="text-sm"
										>
											{ellipsed(event.response)}
										</span>
									</TableCell>
									<TableCell>
										<span
											title={event.methodName}
											className="text-sm"
										>
											{event.methodName}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{event.engineType}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{event.engineName}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{event.latency}ms
										</span>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{event.tokens}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-xs">{`${TimeDateFormatter(event.startTime).time} - ${TimeDateFormatter(event.endTime).time}`}</span>
									</TableCell>
									<TableCell className="text-center">
										{event.status ? (
											<CircleCheckIcon
												className="inline-block h-4 w-4"
												color="#2e7d32"
											/>
										) : (
											<Cancel
												className="inline-block h-4 w-4"
												color="#da291c"
											/>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
				{/* Server-side pagination */}
				<div className="flex items-center gap-2 justify-self-end bg-white p-2">
					<label
						htmlFor="rows-per-page"
						className="font-medium text-gray-700 text-sm"
					>
						Rows per page:
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
						{firstRow} - {lastRow} of {totalCount}
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
					Showing {logs.length} of {totalCount} results
				</span>
			</div>
			{/** sheet open/close when user clicks on the row in auditlog table */}
			<Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
				<SheetContent
					side="right"
					className="min-w-[500px] transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
				>
					<SheetTitle className="sr-only">Audit Details</SheetTitle>
					<AuditLogsDetailDrawer
						logDetails={selectedEvent}
						handleDrawerClose={handleDrawerClose}
					/>
				</SheetContent>
			</Sheet>
		</>
	);
};
