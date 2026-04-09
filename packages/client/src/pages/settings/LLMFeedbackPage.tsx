import { DataGrid } from "@mui/x-data-grid";
import { CalendarIcon, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Calendar,
	Dialog,
	DialogContent,
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
	Spinner,
	toast,
} from "@semoss/ui/next";

interface LLMFeedback {
	AGENT_ID: string;
	PROJECT_ID: string;
	USER_ID: string;
	ENGINE_ID: string;
	DATE_CREATED: string;
	MESSAGE_ID: string;
	MESSAGE_DATA: string;
	MESSAGE_TEXT: string;
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
	const [columns, setColumns] = useState<
		{ field: string; headerName: string; flex: number; minWidth: number }[]
	>([]);
	const [count, setCount] = useState<number>(0);
	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: 10,
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
	const [openMessageModal, setOpenMessageModal] = useState(false);
	const [selectedMessageData, setSelectedMessageData] = useState<string>("");

	const columnDefinitions = [
		"AGENT_ID",
		"PROJECT_ID",
		"USER_ID",
		"DATE_CREATED",
		"RATING",
		"MESSAGE_ID",
		"MESSAGE_DATA",
		"FEEDBACK_TEXT",
		"FEEDBACK_DATE",
	];

	const renderDataGridColumns = useCallback((feedbackData) => {
		if (feedbackData.length === 0 || !feedbackData[0]) return;

		const dataGridColumns = columnDefinitions.map((name) => {
			if (name === "RATING") {
				return {
					field: name,
					headerName: name
						.replace(/_/g, " ")
						.toLowerCase()
						.replace(/\b\w/g, (char) => char.toUpperCase()),
					flex: 1,
					minWidth: 100,
					renderCell: (params) => {
						const rating = params.value;
						return (
							<Badge
								variant="outline"
								className={
									rating === true
										? "border-green-500 font-normal text-green-600"
										: "border-red-500 font-normal text-red-600"
								}
							>
								{rating === true ? "Positive" : "Negative"}
							</Badge>
						);
					},
				};
			}

			if (name === "MESSAGE_DATA") {
				return {
					field: name,
					headerName: name
						.replace(/_/g, " ")
						.toLowerCase()
						.replace(/\b\w/g, (char) => char.toUpperCase()),
					flex: 1,
					minWidth: 100,
					renderCell: (params) => {
						return (
							<button
								type="button"
								className="flex h-full w-full items-center leading-normal text-left"
								onClick={() => {
									setSelectedMessageData(params.value);
									setOpenMessageModal(true);
								}}
							>
								{`"${params.value}"`}
							</button>
						);
					},
				};
			}

			if (name === "FEEDBACK_TEXT") {
				return {
					field: name,
					headerName: name
						.replace(/_/g, " ")
						.toLowerCase()
						.replace(/\b\w/g, (char) => char.toUpperCase()),
					flex: 2,
					minWidth: 100,
					renderCell: (params) => {
						return (
							<div className="flex h-full items-center whitespace-normal break-words italic leading-normal">
								{params.value
									? params.value
									: "No Feedback Provided"}
							</div>
						);
					},
				};
			}

			return {
				field: name,
				headerName: name
					.replace(/_/g, " ")
					.toLowerCase()
					.replace(/\b\w/g, (char) => char.toUpperCase()),
				flex: 1,
				minWidth: 100,
			};
		});

		setColumns(dataGridColumns);
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
			const dataGridRows = getFeedback.data.map((item, index) => {
				const { USER_NAME, ...rest } = item;
				return {
					id: index + 1,
					...rest,
				};
			});

			setFeedback(dataGridRows);

			if (dataGridRows.length > 0) {
				renderDataGridColumns(dataGridRows);
			}
		} else if (getFeedback.status === "ERROR") {
			toast.error(String(getFeedback.error));
		}
	}, [
		getFeedback.status,
		getFeedback.data,
		getFeedback.error,
		renderDataGridColumns,
	]);

	useEffect(() => {
		if (getCount.status === "SUCCESS") {
			setCount(parseInt(getCount.data[0].TOTAL_FEEDBACK || "0", 10));
		} else if (getCount.status === "ERROR") {
			toast.error(String(getCount.error));
		}
	}, [getCount.status, getCount.data, getCount.error]);

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
		isSearching;

	return (
		<>
			{isLoading && (
				<div className="fixed inset-0 z-[1501] flex items-center justify-center bg-white/50">
					<div className="flex flex-col items-center gap-1">
						<Spinner />
						<p className="text-sm">
							{isSearching ? "Searching" : "Loading"}
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
					<div className="ml-auto">
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
			{openMessageModal && (
				<Dialog
					open={openMessageModal}
					onOpenChange={setOpenMessageModal}
				>
					<DialogContent>
						<div className="flex flex-col gap-4">
							<h3 className="font-semibold text-lg">
								Message Data
							</h3>
							<p className="whitespace-pre-wrap text-sm">
								{`"${selectedMessageData}"`}
							</p>
						</div>
					</DialogContent>
				</Dialog>
			)}
			<DataGrid
				rows={feedback}
				rowCount={count}
				columns={columns}
				initialState={{
					pagination: {
						paginationModel: { pageSize: 10, page: 0 },
					},
					sorting: {
						sortModel: [{ field: "DATE_CREATED", sort: "desc" }],
					},
				}}
				localeText={{
					noRowsLabel: "No data to display.",
				}}
				paginationMode="server"
				pageSizeOptions={[10, 25, 50]}
				paginationModel={paginationModel}
				onPaginationModelChange={setPaginationModel}
			/>
		</>
	);
};
