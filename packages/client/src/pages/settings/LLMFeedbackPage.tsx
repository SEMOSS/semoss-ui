import { DataGrid } from "@mui/x-data-grid";
import { CalendarIcon, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
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
	MESSAGE_TYPE: string;
	MESSAGE_TEXT: string;
	FEEDBACK_TEXT: string;
	FEEDBACK_DATE: string;
	RATING: boolean;
	POSITIVE_FEEDBACK: string;
	NEGATIVE_FEEDBACK: string;
	TOTAL_FEEDBACK: string;
}

export const LLMFeedbackPage = () => {
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
	const [startDate, setStartDate] = useState(null);
	const [endDate, setEndDate] = useState(null);
	const [search, setSearch] = useState<string>("");
	const [debouncedSearch, setDebouncedSearch] = useState<string>("");
	const [isSearching, setIsSearching] = useState(false);

	const searchbarRef = useRef<HTMLInputElement | null>(null);

	const columnDefinitions = [
		"AGENT_ID",
		"PROJECT_ID",
		"USER_ID",
		"DATE_CREATED",
		"RATING",
		"MESSAGE_ID",
		"MESSAGE_TYPE",
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

			if (name === "MESSAGE_TYPE") {
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
							<Badge
								variant="outline"
								className="size-sm font-normal"
							>
								{params.value.toString().replace(/_/g, " ")}
							</Badge>
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
							<div className="flex h-full items-center whitespace-normal break-words leading-normal">
								{params.value}
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
			setDebouncedSearch(search);
			setIsSearching(false);
		}, 400);

		return () => clearTimeout(timer);
	}, [search]);

	const offset = paginationModel.page * paginationModel.pageSize;
	const limit = paginationModel.pageSize;

	const getFeedback = usePixel<LLMFeedback[]>(
		`AdminGetLlmFeedback(
            limit=[${limit}], 
            offset=[${offset}]${engineId ? `, engineId=["${engineId}"]` : ""}${projectId ? `, projectId=["${projectId}"]` : ""}${userId ? `, userId=["${userId}"]` : ""}${startDate ? `, startDate=["${startDate.toISOString().split("T")[0]}"]` : ""}${endDate ? `, endDate=["${endDate.toISOString().split("T")[0]}"]` : ""}${debouncedSearch ? `, search=["${debouncedSearch}"]` : ""}
        );`,
		{ data: [] },
	);

	const getCount = usePixel<[string]>(
		`AdminGetLlmFeedbackCount(${engineId ? `engineId=["${engineId}"]` : ""}${projectId ? `, projectId=["${projectId}"]` : ""}${userId ? `, userId=["${userId}"]` : ""}${startDate ? `, startDate=["${startDate.toISOString().split("T")[0]}"]` : ""}${endDate ? `, endDate=["${endDate.toISOString().split("T")[0]}"]` : ""}${debouncedSearch ? `, search=["${debouncedSearch}"]` : ""});`,
		{ data: ["0"] },
	);

	const resetKey = `${engineId}-${projectId}-${userId}-${startDate}-${endDate}-${debouncedSearch}`;

	useEffect(() => {
		setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
		setFeedback([]);
	}, [resetKey, paginationModel.pageSize]);

	useEffect(() => {
		if (getFeedback.status === "SUCCESS" && getFeedback.data.length > 0) {

			const dataGridRows = getFeedback.data.map((item, index) => {
				const { USER_NAME, ...rest } = item;
				return {
					id: index + 1,
					...rest,
				};
			});

			setFeedback(dataGridRows);
			renderDataGridColumns(dataGridRows);
			searchbarRef.current?.focus();
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

	const uniqueUserIds = useMemo(
		() =>
			Array.from(new Set(feedback.map((item) => item.USER_ID)))
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
			<div className="flex w-full items-end gap-2">
				<InputGroup className="h-10 min-w-[140px] flex-1">
					<InputGroupAddon>
						<Search className="size-4" />
					</InputGroupAddon>
					<InputGroupInput
						ref={searchbarRef}
						className="h-10"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
						}}
						placeholder="Search"
					/>
					{search ? (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								size="icon-xs"
								variant="ghost"
								onClick={() => setSearch("")}
								aria-label="Clear search"
							>
								<X className="size-4" />
							</InputGroupButton>
						</InputGroupAddon>
					) : null}
				</InputGroup>
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
				<Select value={userId} onValueChange={setUserId}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="User ID" />
					</SelectTrigger>
					<SelectContent>
						{uniqueUserIds.map((userId) => (
							<SelectItem key={userId} value={userId}>
								{userId}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
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
				<Button
					variant="outline"
					className="bg-transparent text-muted-foreground"
					onClick={() => {
						setEngineId("");
						setProjectId("");
						setUserId("");
						setStartDate(null);
						setEndDate(null);
					}}
				>
					Clear
				</Button>
			</div>
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
