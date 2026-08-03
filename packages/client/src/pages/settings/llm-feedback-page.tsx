import {
	CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Copy,
	Download,
	Search,
	X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runPixel, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Calendar,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";

interface LLMFeedback {
	AGENT_ID: string;
	PROJECT_ID: string;
	WORKSPACE_ID: string;
	USER_ID: string;
	USER_NAME: string;
	ENGINE_ID: string;
	DATE_CREATED: string;
	MESSAGE_ID: string;
	MESSAGE_DATA: string;
	MESSAGE_TEXT: string;
	PROMPT: string;
	FEEDBACK_TEXT: string;
	FEEDBACK_DATE: string;
	RATING: boolean;
	TOTAL_FEEDBACK: string;
}

export const LLMFeedbackPage = () => {
	const currentDate = useMemo(() => new Date(), []);
	const thirtyDaysFilter = useMemo(() => {
		const date = new Date();
		date.setDate(date.getDate() - 30);
		return date;
	}, []);

	const [feedback, setFeedback] = useState<LLMFeedback[]>([]);
	const [count, setCount] = useState<number>(0);
	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: 50,
	});
	const [engineId, setEngineId] = useState<string>("");
	const [projectId, setProjectId] = useState<string>("");
	const [userId, setUserId] = useState<string>("");
	const [startDate, setStartDate] = useState<Date | undefined>(
		thirtyDaysFilter,
	);
	const [endDate, setEndDate] = useState<Date | undefined>(currentDate);
	const [debouncedUserId, setDebouncedUserId] = useState<string>("");
	const [isSearching, setIsSearching] = useState(false);
	const [selectedRow, setSelectedRow] = useState<LLMFeedback | null>(null);
	const [isExporting, setIsExporting] = useState(false);

	const columnDefinitions = useMemo(
		() => [
			"AGENT_ID",
			"PROJECT_ID",
			"WORKSPACE_ID",
			"USER_NAME",
			"DATE_CREATED",
			"RATING",
			"MESSAGE_ID",
			"PROMPT",
			"MESSAGE_DATA",
			"FEEDBACK_TEXT",
			"FEEDBACK_DATE",
		],
		[],
	);

	const formatHeader = useCallback(
		(name: string) =>
			name
				.replace(/_/g, " ")
				.toLowerCase()
				.replace(/\b\w/g, (char) => char.toUpperCase()),
		[],
	);

	// Per-column max widths so long string fields don't blow up the row height.
	const columnMaxWidth: Record<string, number> = {
		AGENT_ID: 140,
		PROJECT_ID: 140,
		WORKSPACE_ID: 140,
		USER_NAME: 140,
		DATE_CREATED: 170,
		RATING: 110,
		MESSAGE_ID: 140,
		PROMPT: 220,
		MESSAGE_DATA: 220,
		FEEDBACK_TEXT: 220,
		FEEDBACK_DATE: 170,
	};

	const renderCompactCell = useCallback(
		(field: string, value: unknown): ReactNode => {
			if (field === "RATING") {
				return (
					<Badge
						variant="outline"
						className={
							value === true
								? "border-green-500 font-normal text-green-600"
								: "border-red-500 font-normal text-red-600"
						}
					>
						{value === true ? "Positive" : "Negative"}
					</Badge>
				);
			}
			if (field === "FEEDBACK_TEXT" && !value) {
				return (
					<span className="text-muted-foreground italic">
						No Feedback Provided
					</span>
				);
			}
			return String(value ?? "");
		},
		[],
	);

	const prettyFormat = useCallback((value: unknown): string => {
		if (value === null || value === undefined || value === "") return "";
		const str = String(value);
		try {
			return JSON.stringify(JSON.parse(str), null, 2);
		} catch {
			return str;
		}
	}, []);

	const copyToClipboard = useCallback(async (text: string, label: string) => {
		if (!text) {
			toast.error(`${label} is empty`);
			return;
		}
		try {
			await navigator.clipboard.writeText(text);
			toast.success(`Copied ${label}`);
		} catch {
			toast.error(`Failed to copy ${label}`);
		}
	}, []);

	useEffect(() => {
		setIsSearching(true);
		const timer = setTimeout(() => {
			setDebouncedUserId(userId);
			setPaginationModel((prev) => ({ ...prev, page: 0 }));
			setIsSearching(false);
		}, 400);

		return () => clearTimeout(timer);
	}, [userId]);

	const offset = paginationModel.page * paginationModel.pageSize;
	const limit = paginationModel.pageSize;

	const shouldFetchData = (startDate && endDate) || (!startDate && !endDate);

	// default to last 30 days if no start date is selected
	const getFeedback = usePixel<LLMFeedback[]>(
		shouldFetchData
			? `AdminGetLlmFeedback(
            limit=[${limit}], 
            offset=[${offset}]${engineId ? `, engine=["${engineId}"]` : ""}${projectId ? `, project=["${projectId}"]` : ""}${debouncedUserId ? `, userId=["${debouncedUserId}"]` : ""}, startDate=["${startDate.toISOString().split("T")[0]}"], endDate=["${endDate.toISOString().split("T")[0]}"]);`
			: "",
		{ data: [] },
	);

	const getCount = usePixel<[string]>(
		shouldFetchData
			? `AdminGetLlmFeedbackCount(${engineId ? `engine=["${engineId}"]` : ""}${projectId ? `, project=["${projectId}"]` : ""}${debouncedUserId ? `, userId=["${debouncedUserId}"]` : ""}, startDate=["${startDate.toISOString().split("T")[0]}"], endDate=["${endDate.toISOString().split("T")[0]}"]);`
			: "",
		{ data: ["0"] },
	);

	useEffect(() => {
		if (getFeedback.status === "SUCCESS") {
			const dataGridRows = getFeedback.data.map((item, index) => ({
				id: index + 1,
				...item,
			}));

			setFeedback(dataGridRows);
		} else if (getFeedback.status === "ERROR") {
			toast.error(String(getFeedback.error));
		}
	}, [getFeedback.status, getFeedback.data, getFeedback.error]);

	useEffect(() => {
		if (getCount.status === "SUCCESS") {
			setCount(parseInt(getCount.data[0].TOTAL_FEEDBACK || "0", 10));
		} else if (getCount.status === "ERROR") {
			toast.error(String(getCount.error));
		}
	}, [getCount.status, getCount.data, getCount.error]);

	const escapeCsvValue = (value: unknown): string => {
		if (value === null || value === undefined) return "";
		const str = String(value);
		return `"${str.replace(/"/g, '""')}"`;
	};

	const handleExportToCsv = async () => {
		if (!startDate || !endDate || count === 0) return;

		setIsExporting(true);
		try {
			const exportPixel = `AdminGetLlmFeedback(
                limit=[${count}],
                offset=[0]${engineId ? `, engine=["${engineId}"]` : ""}${projectId ? `, project=["${projectId}"]` : ""}${debouncedUserId ? `, userId=["${debouncedUserId}"]` : ""}, startDate=["${startDate.toISOString().split("T")[0]}"], endDate=["${endDate.toISOString().split("T")[0]}"]);`;

			const response = await runPixel(exportPixel);
			const firstResult = response?.pixelReturn?.[0];
			const rows = (firstResult?.output as LLMFeedback[]) || [];

			if (rows.length === 0) {
				toast.error("No data to export");
				return;
			}

			const headers = columnDefinitions.map((field) =>
				field
					.replace(/_/g, " ")
					.toLowerCase()
					.replace(/\b\w/g, (char) => char.toUpperCase()),
			);

			const csvRows = rows.map((row) =>
				columnDefinitions
					.map((field) => {
						const value = row[field as keyof LLMFeedback];
						if (field === "RATING") {
							return escapeCsvValue(
								value === true ? "Positive" : "Negative",
							);
						}
						return escapeCsvValue(value);
					})
					.join(","),
			);

			const csvContent = [
				headers.map(escapeCsvValue).join(","),
				...csvRows,
			].join("\n");

			const blob = new Blob([csvContent], {
				type: "text/csv;charset=utf-8;",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `llm-feedback-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success("Exported to CSV");
		} catch (error) {
			toast.error(`Failed to export: ${error}`);
		} finally {
			setIsExporting(false);
		}
	};

	const uniqueEngineIds = useMemo(
		() =>
			Array.from(new Set(feedback.map((item) => item.AGENT_ID)))
				.filter(Boolean)
				.sort(),
		[feedback],
	);

	const uniqueProjectIds = useMemo(
		() =>
			Array.from(new Set(feedback.map((item) => item.PROJECT_ID)))
				.filter(Boolean)
				.sort(),
		[feedback],
	);

	const isLoading =
		getFeedback.status === "LOADING" ||
		getCount.status === "LOADING" ||
		isSearching ||
		isExporting;

	return (
		<>
			{isLoading && (
				<div className="fixed inset-0 z-[1501] flex items-center justify-center bg-background/50">
					<div className="flex flex-col items-center gap-1">
						<Spinner />
						<p className="text-sm">
							{isExporting
								? "Exporting"
								: isSearching
									? "Searching"
									: "Loading"}
						</p>
						<p className="text-muted-foreground text-xs">
							LLM Feedback
						</p>
					</div>
				</div>
			)}
			<div className="justify-between">
				<div className="flex w-full items-end gap-2">
					<Select value={engineId} onValueChange={setEngineId}>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="Agent ID" />
						</SelectTrigger>
						<SelectContent>
							{uniqueEngineIds.map((id) => {
								return (
									<SelectItem key={id} value={id}>
										{id}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
					<Select value={projectId} onValueChange={setProjectId}>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="Project ID" />
						</SelectTrigger>
						<SelectContent>
							{uniqueProjectIds.map((projectId) => (
								<SelectItem key={projectId} value={projectId}>
									{projectId}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<InputGroup className="w-[150px]">
						<InputGroupAddon>
							<Search className="size-4" />
						</InputGroupAddon>
						<InputGroupInput
							value={userId}
							onChange={(e) => {
								setUserId(e.target.value);
							}}
							placeholder="User ID"
						/>
						{userId ? (
							<InputGroupAddon align="inline-end">
								<InputGroupButton
									size="icon-xs"
									variant="ghost"
									onClick={() => setUserId("")}
									aria-label="Clear search"
								>
									<X className="size-4" />
								</InputGroupButton>
							</InputGroupAddon>
						) : null}
					</InputGroup>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								className="w-[150px] justify-between bg-transparent font-normal"
							>
								<span className="text-muted-foreground">
									{startDate
										? `${new Date(startDate).toLocaleDateString()}`
										: "Start Date"}
								</span>
								<CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={startDate}
								onSelect={(date) => setStartDate(date)}
								numberOfMonths={2}
							/>
						</PopoverContent>
					</Popover>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								className="w-[150px] justify-between bg-transparent font-normal"
							>
								<span className="text-muted-foreground">
									{endDate
										? `${new Date(endDate).toLocaleDateString()}`
										: "End Date"}
								</span>
								<CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={endDate}
								onSelect={(date) => setEndDate(date)}
								numberOfMonths={2}
							/>
						</PopoverContent>
					</Popover>
					<div className="ml-auto flex gap-2">
						<Button
							variant="outline"
							className="bg-transparent text-muted-foreground"
							disabled={isExporting || count === 0 || isLoading}
							onClick={handleExportToCsv}
						>
							<Download className="mr-2 size-4" />
							Export CSV
						</Button>
						<Button
							variant="outline"
							className="bg-transparent text-muted-foreground"
							onClick={() => {
								setEngineId("");
								setProjectId("");
								setUserId("");
								setStartDate(thirtyDaysFilter);
								setEndDate(currentDate);
							}}
						>
							Clear
						</Button>
					</div>
				</div>
			</div>
			<Sheet
				open={selectedRow !== null}
				onOpenChange={(open) => {
					if (!open) setSelectedRow(null);
				}}
			>
				<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
					<SheetHeader>
						<SheetTitle>Feedback Details</SheetTitle>
						<SheetDescription>
							{selectedRow?.DATE_CREATED ?? ""}
						</SheetDescription>
					</SheetHeader>
					{selectedRow && (
						<div className="flex flex-col gap-4 px-4 pb-6">
							<div className="flex items-center gap-2">
								<span className="font-medium text-muted-foreground text-xs">
									Rating
								</span>
								<Badge
									variant="outline"
									className={
										selectedRow.RATING === true
											? "border-green-500 font-normal text-green-600"
											: "border-red-500 font-normal text-red-600"
									}
								>
									{selectedRow.RATING === true
										? "Positive"
										: "Negative"}
								</Badge>
							</div>
							{columnDefinitions
								.filter((f) => f !== "RATING")
								.map((field) => {
									const raw = selectedRow[
										field as keyof LLMFeedback
									] as unknown;
									const isLong =
										field === "PROMPT" ||
										field === "MESSAGE_DATA" ||
										field === "MESSAGE_TEXT" ||
										field === "FEEDBACK_TEXT";
									const display = isLong
										? prettyFormat(raw)
										: String(raw ?? "");
									const label = formatHeader(field);
									return (
										<div
											key={field}
											className="group flex flex-col gap-1"
										>
											<div className="flex items-center gap-1.5">
												<span className="font-medium text-muted-foreground text-xs">
													{label}
												</span>
												<Button
													variant="ghost"
													size="icon"
													className="size-5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
													onClick={() =>
														copyToClipboard(
															display,
															label,
														)
													}
													aria-label={`Copy ${label}`}
												>
													<Copy className="size-3" />
												</Button>
											</div>
											{isLong ? (
												<pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-2 font-mono text-xs">
													{display ||
														(field ===
														"FEEDBACK_TEXT"
															? "No Feedback Provided"
															: "")}
												</pre>
											) : (
												<span className="break-all text-sm">
													{display}
												</span>
											)}
										</div>
									);
								})}
						</div>
					)}
				</SheetContent>
			</Sheet>
			<div className="mt-4 overflow-auto rounded-md border">
				<table className="w-full text-sm">
					<thead className="bg-muted/50">
						<tr>
							{columnDefinitions.map((field) => (
								<th
									key={field}
									className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
									style={{
										maxWidth: columnMaxWidth[field],
									}}
								>
									{formatHeader(field)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{feedback.length === 0 ? (
							<tr>
								<td
									colSpan={columnDefinitions.length}
									className="py-8 text-center text-muted-foreground"
								>
									No data to display.
								</td>
							</tr>
						) : (
							feedback.map((row) => (
								<tr
									key={row.id}
									className="cursor-pointer border-t hover:bg-muted/30"
									onClick={() => setSelectedRow(row)}
								>
									{columnDefinitions.map((field) => (
										<td
											key={field}
											className="px-3 py-2 align-middle"
											style={{
												maxWidth: columnMaxWidth[field],
											}}
										>
											<div className="truncate">
												{renderCompactCell(
													field,
													row[
														field as keyof LLMFeedback
													],
												)}
											</div>
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			{/* Pagination */}
			<div className="mt-2 flex items-center justify-between text-muted-foreground text-sm">
				<div className="flex items-center gap-2">
					<span>Rows per page:</span>
					<Select
						value={String(paginationModel.pageSize)}
						onValueChange={(val) =>
							setPaginationModel({
								page: 0,
								pageSize: Number(val),
							})
						}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[50, 100, 200].map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<span>
						{paginationModel.page * paginationModel.pageSize + 1}–
						{Math.min(
							(paginationModel.page + 1) *
								paginationModel.pageSize,
							count,
						)}{" "}
						of {count}
					</span>
					<Button
						variant="outline"
						size="icon"
						disabled={paginationModel.page === 0}
						onClick={() =>
							setPaginationModel((prev) => ({
								...prev,
								page: prev.page - 1,
							}))
						}
					>
						<ChevronLeft className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						disabled={
							(paginationModel.page + 1) *
								paginationModel.pageSize >=
							count
						}
						onClick={() =>
							setPaginationModel((prev) => ({
								...prev,
								page: prev.page + 1,
							}))
						}
					>
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>
		</>
	);
};
