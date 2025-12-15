import { ChevronDownIcon, RotateCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { AuditLogsDataTable, AuditLogsTimeline } from "@semoss/shared";
import {
	Button,
	Calendar,
	type DateRange,
	// Calendar,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Input,
	Popover,
	PopoverAnchor,
	PopoverContent,
	Skeleton,
} from "@semoss/ui/next";
import { useUserRootStore } from "@/hooks/useUserRootStore";
import { ENGINE_TYPES, type EventData } from "./common/utility";

const initialAcc = {
	APP: [],
	MODEL: [],
	DATABASE: [],
	VECTOR: [],
	FUNCTION: [],
	STORAGE: [],
};

const DashboardDurations = [
	{ label: "Today", value: "today", dateRangeType: "DAY", dateRangeValue: 1 },
	{
		label: "Last 7 Days",
		value: "last7days",
		dateRangeType: "WEEK",
		dateRangeValue: 1,
	},
	{
		label: "Last 30 Days",
		value: "last30days",
		dateRangeType: "MONTH",
		dateRangeValue: 1,
	},
	{
		label: "Custom",
		value: "custom",
		renderWithSeparator: true,
		dateRangeType: "CUSTOM",
		dateRangeValue: 1,
	},
];

export const AuditLogPage = ({ catalogName }) => {
	const { insightId } = useInsight();
	const [logs, setLogs] = useState<EventData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState<boolean>(true);
	const rootStore = useUserRootStore(insightId);
	const [engineDetails, setEngineDetails] = useState({ ...initialAcc });
	const [engineSelectionDetails, setEngineSelectionDetails] = useState({
		engineType: "",
		engineId: "",
	});
	const [dashboardDuration, setDashboardDuration] =
		useState<(typeof DashboardDurations)[number]["value"]>("");
	const [showCustomPopover, setShowCustomPopover] = useState<boolean>(false);
	const [customDateRange, setCustomDateRange] = useState<DateRange | null>({
		from: new Date(),
		to: new Date(),
	});

	useEffect(() => {
		async function getMyEngines() {
			if (insightId) {
				const response = await runPixel(`MyEngines();`, insightId);
				const responseData = response.pixelReturn[0].output;
				const enginesDropdown = (
					responseData as Array<{
						database_id: string;
						app_type: string;
						app_name: string;
					}>
				).reduce(
					(acc, engine) => {
						// Only accept known app_types
						if (Object.hasOwn(acc, engine.app_type)) {
							acc[engine.app_type] = [
								...acc[engine.app_type],
								{
									value: engine.database_id,
									label: engine.app_name,
								},
							];
						}
						return acc;
					},
					{ ...initialAcc },
				);
				setEngineDetails(enginesDropdown);
			}
		}
		getMyEngines();
	}, [insightId]);

	const SelectedDuration = useMemo(() => {
		return (
			DashboardDurations.find(
				(duration) => duration.value === dashboardDuration,
			) || { label: "", value: "", dateRangeType: "", dateRangeValue: 1 }
		);
	}, [dashboardDuration]);

	// const notification = useNotification();

	const fetchLogs = async (limit: number, offset: number) => {
		setLoading(true);
		try {
			const date = new Date();
			const yyyy = date.getFullYear();
			const mm = String(date.getMonth() + 1).padStart(2, "0");
			const dd = String(date.getDate()).padStart(2, "0");
			const hh = String(date.getHours()).padStart(2, "0");
			const min = String(date.getMinutes()).padStart(2, "0");
			const ss = String(date.getSeconds()).padStart(2, "0");

			const dateTime = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
			const catalogId = engineSelectionDetails.engineId ?? null;
			catalogName = engineSelectionDetails.engineType;
			const startDate = new Date(
				customDateRange?.from?.setUTCHours(0, 0, 0, 0),
			);
			const endDate = new Date(
				customDateRange?.to?.setUTCHours(23, 59, 59, 999),
			);
			const response = await runPixel(
				`AuditLogReport(paramValues=[{"userId": "${rootStore?.user?.id}","projectId" : "${catalogName === "APP" ? catalogId : ""}","engineId": "${catalogName === "APP" ? "" : catalogId}","dateTime":"${dateTime}","limit":"${limit}","offset":"${offset}","dateRangeType": "${SelectedDuration.dateRangeType || "DAY"}","dateRangeValue": ${SelectedDuration.dateRangeValue} ${SelectedDuration.dateRangeType === "CUSTOM" ? `,"startDate": "${startDate?.toISOString()}", "endDate": "${endDate?.toISOString()}"` : ""}}]);`,
				insightId,
			);
			const responseData = response.pixelReturn[0].output as {
				logs: EventData[];
				totalCount: number;
			};
			if (responseData?.logs) {
				const responseLogs =
					responseData?.logs as unknown as EventData[];
				setLogs((responseLogs as unknown as EventData[]) || []);
				setTotalCount(responseData?.totalCount || 0);
			}
			if (!responseData?.logs) {
				const responseLogs = responseData as unknown as EventData[];
				setLogs((responseLogs as unknown as EventData[]) || []);
				setTotalCount(responseLogs?.length || 0);
			}
		} catch (error) {
			setLogs([]);
			// notification.add({
			// 	color: "error",
			// 	message: `Error fetching logs: ${error}`,
			// });
			console.error("Error fetching logs:", error);
		} finally {
			setLoading(false);
		}
	};

	const handlePaginationChange = (
		newPage: number,
		newRowsPerPage: number,
	) => {
		const offset = newPage * newRowsPerPage;
		setPage(newPage);
		setRowsPerPage(newRowsPerPage);
		fetchLogs(newRowsPerPage, offset);
	};
	// biome-ignore lint/correctness/useExhaustiveDependencies: adding fetchLogs causes infinite rerender and based on rootStore user id, data has to be fetched
	useEffect(() => {
		//By default engine type and id is required to show the logs
		if (
			!catalogName ||
			!rootStore?.user?.id ||
			!engineSelectionDetails.engineId
		) {
			setLogs([]);
			setLoading(false);
			return;
		}
		if (
			catalogName &&
			rootStore?.user?.id &&
			engineSelectionDetails.engineId
		) {
			setLogs([]);
			fetchLogs(rowsPerPage, page * rowsPerPage);
		}
		//override the parent css which has id = home__content
		const contentElement = document.getElementById("home__container");
		if (contentElement) {
			contentElement.style.padding = "32px";
			contentElement.style.maxWidth = "none";
		}

		return () => {
			if (contentElement) {
				//restore the original styles
				contentElement.style.padding = "";
				contentElement.style.maxWidth = "";
			}
		};
	}, [
		catalogName,
		rowsPerPage,
		page,
		rootStore?.user?.id,
		engineSelectionDetails.engineId,
		dashboardDuration,
	]);

	const dateFormat = (dateString: string | undefined) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};
	//biome-ignore lint/correctness/useExhaustiveDependencies: adding dataFormat causes infinite rerender
	const renderCustomDatePopover = useCallback(() => {
		if (!showCustomPopover) return null;
		return (
			<Popover open={showCustomPopover}>
				<PopoverAnchor>
					<PopoverContent className="flex w-[75%] flex-col gap-4 p-4">
						<div className="flex justify-between gap-2">
							<Input
								value={dateFormat(
									customDateRange.from?.toString(),
								)}
								type="text"
								className="w-[50%]"
							></Input>
							<Input
								value={dateFormat(
									customDateRange.to?.toString(),
								)}
								type="text"
								className="w-[50%]"
							></Input>
						</div>
						<div className="flex justify-around">
							<Calendar
								mode="range"
								selected={customDateRange}
								onSelect={(daterange) => {
									if (daterange?.from && daterange?.to) {
										setCustomDateRange(daterange);
									}
								}}
								className="rounded-md border shadow-sm"
								captionLayout="dropdown"
								timeZone="UTC"
							/>
						</div>
						<div className="flex justify-end">
							<Button
								variant="outline"
								className="w-fit justify-end bg-primary text-white"
								size="sm"
								onClick={() => {
									setShowCustomPopover(false);
									if (
										customDateRange?.from &&
										customDateRange?.to &&
										engineSelectionDetails.engineId
									) {
										fetchLogs(
											rowsPerPage,
											page * rowsPerPage,
										);
									}
								}}
							>
								Apply
							</Button>
						</div>
					</PopoverContent>
				</PopoverAnchor>
			</Popover>
		);
	}, [showCustomPopover, customDateRange]);

	const renderFilterSection = useCallback(() => {
		return (
			<div className="flex gap-2">
				<div className="flex min-w-[100px] justify-between">
					<DropdownMenu>
						<DropdownMenuTrigger
							asChild
							className="flex justify-between align-center"
						>
							<Button
								variant="outline"
								size="sm"
								className={`flex min-w-[180px] justify-between`}
							>
								<div className="flex w-full justify-between align-center">
									<span className="flex justify-start">
										{engineSelectionDetails.engineType !==
										""
											? engineSelectionDetails.engineType
											: "Select Engine Type"}{" "}
									</span>
									<ChevronDownIcon className="flex justify-end align-center" />
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
							className="flex justify-between align-center"
						>
							<Button
								variant="outline"
								size="sm"
								className={`flex min-w-[180px] justify-between`}
							>
								<div className="flex w-full justify-between">
									<span className="flex justify-start">
										{engineDetails?.[
											engineSelectionDetails?.engineType
										]
											?.filter(
												(engine) =>
													engine.value ===
													engineSelectionDetails.engineId,
											)
											.map((engine) => engine.label) ??
											"Select Engine"}{" "}
									</span>
									<ChevronDownIcon className="flex justify-end align-center" />
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
											key={engine.value}
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
				<div className="min-w-[100px]">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								{SelectedDuration?.label === ""
									? "Today"
									: SelectedDuration?.label}{" "}
								<ChevronDownIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							{/* Add dropdown items here */}
							<DropdownMenuRadioGroup>
								{DashboardDurations.map((duration) => (
									<>
										{duration.renderWithSeparator && (
											<DropdownMenuSeparator />
										)}
										<DropdownMenuCheckboxItem
											key={duration.value}
											checked={
												duration.value ===
												dashboardDuration
											}
											onCheckedChange={() => {
												setDashboardDuration(
													duration.value,
												);
												if (
													duration.value === "custom"
												) {
													setShowCustomPopover(true);
												} else {
													if (showCustomPopover)
														setShowCustomPopover(
															false,
														);
												}
											}}
										>
											{duration.label}
										</DropdownMenuCheckboxItem>
									</>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		);
	}, [
		engineSelectionDetails,
		engineDetails,
		dashboardDuration,
		showCustomPopover,
		SelectedDuration.label,
	]);

	return (
		<div className="flex flex-col gap-4 px-8 py-8">
			<div className="flex w-full items-center py-4">
				<h6 className="font-medium text-xl leading-[1.6] tracking-normal">
					{catalogName} Insight Dashboard
				</h6>
				<div className="ml-auto flex flex-row gap-4">
					{/* Disabled for now */}
					{/* <Select
							variant="outlined"
							size="small"
							onChange={() => {}}
							sx={{ minWidth: 120 }}
							value={"Last 30 Days"}
						>
							<Menu.Item value="Last 30 Days">
								Last 30 Days
							</Menu.Item>
							<Menu.Item value="Last 90 Days">
								Last 90 Days
							</Menu.Item>
							<Menu.Item value="Last Year">Last Year</Menu.Item>
						</Select> */}
					{renderFilterSection()}
					{renderCustomDatePopover()}
					<Button
						variant="default"
						onClick={() => {
							if (
								!engineSelectionDetails.engineId ||
								!rootStore?.user?.id
							) {
								return;
							}
							fetchLogs(rowsPerPage, page * rowsPerPage);
						}}
					>
						<RotateCw className="mr-2 h-4 w-4" />
						Refresh
					</Button>
				</div>
			</div>
			{loading ? (
				<div className="flex flex-col gap-4">
					<Skeleton className="h-[400px] w-full rounded-md" />{" "}
					<Skeleton className="h-[400px] w-full rounded-md" />
				</div>
			) : (
				<>
					<AuditLogsTimeline logs={logs} />
					<AuditLogsDataTable
						logs={logs}
						totalCount={totalCount}
						page={page}
						rowsPerPage={rowsPerPage}
						onPaginationChange={handlePaginationChange}
					/>
				</>
			)}
		</div>
	);
};
