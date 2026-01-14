import { ChevronDownIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
	PopoverAnchor,
	PopoverContent,
} from "@semoss/ui/next";
import { dateFormat, ENGINE_TYPES } from "./common";

//initial state of engine details
const initialAcc = {
	APP: [],
	MODEL: [],
	DATABASE: [],
	VECTOR: [],
	FUNCTION: [],
	STORAGE: [],
};
//Dashboard durations for filtering logs based on duration like day, week, month, etc
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

/**
 * AuditLogFilter component is used for filtering audit logs
 * It filters by engine type, engine id, and dashboard duration.
 * It also provides a custom date range feature for filtering audit logs.
 *
 * @param {React.ComponentProps} props - The props passed to the component
 * @returns {JSX.Element} - The rendered component shows filter details for audit logs if it is auditlogs package, every filters are shown and for client package it will show duration filter
 */
export const AuditLogFilter = (props) => {
	const { insightId, updateLogs, parent = null } = props;
	const [engineDetails, setEngineDetails] = useState({ ...initialAcc }); //engine details for user
	const [engineSelectionDetails, setEngineSelectionDetails] = useState({
		engineType: "", // selected engine type
		engineId: "", //selected engine id
	});
	const [dashboardDuration, setDashboardDuration] =
		useState<(typeof DashboardDurations)[number]["value"]>(""); //selected dashboard duration
	const [showCustomPopover, setShowCustomPopover] = useState<boolean>(false); //show custom popover for custom date range
	const [customDateRange, setCustomDateRange] = useState<DateRange | null>({
		from: new Date(),
		to: new Date(),
	}); //custom date range data

	//fetch engines for user
	useEffect(() => {
		async function getMyEngines() {
			if (insightId) {
				const response = await runPixel(`MyEngines();`, insightId);
				const responseData = response.pixelReturn[0].output;
				let enginesDropdown = (
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
				const projectResponse = await runPixel(
					`MyProjects();`,
					insightId,
				);
				const projectResponseData =
					projectResponse.pixelReturn[0].output;
				const projectsDropdown = (
					projectResponseData as Array<{
						project_id: string;
						project_type: string;
						project_name: string;
					}>
				).reduce(
					(acc, engine) => {
						// Only accept known app_types
						if (Object.hasOwn(acc, "APP")) {
							acc.APP = [
								...acc.APP,
								{
									value: engine.project_id,
									label: engine.project_name,
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
		}
		getMyEngines();
	}, [insightId]);
	//getting details about label, value, daterangetype and value of selected dashboard duration
	const SelectedDuration = useMemo(() => {
		return (
			DashboardDurations.find(
				(duration) => duration.value === dashboardDuration,
			) || { label: "", value: "", dateRangeType: "", dateRangeValue: 1 }
		);
	}, [dashboardDuration]);
	//logs table will be updated when engineid or duration or daterange or engine type
	useEffect(() => {
		// Implementation for triggering logs API
		if (engineSelectionDetails.engineId !== "" || parent) {
			updateLogs({
				engineId: engineSelectionDetails.engineId,
				duration: dashboardDuration,
				customDateRange: customDateRange,
				engineType: engineSelectionDetails.engineType,
				SelectedDuration: SelectedDuration,
			});
		}
	}, [
		engineSelectionDetails.engineId,
		dashboardDuration,
		customDateRange,
		engineSelectionDetails.engineType,
	]);
	//render custom date popover
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
									setShowCustomPopover(false);
								}}
							>
								Close
							</Button>
							<Button
								variant="outline"
								className="w-fit justify-end bg-primary text-white"
								size="sm"
								onClick={() => {
									setShowCustomPopover(false);
								}}
							>
								Apply
							</Button>
						</div>
					</PopoverContent>
				</PopoverAnchor>
			</Popover>
		);
	}, [showCustomPopover, customDateRange, engineSelectionDetails.engineId]);

	return (
		<div className="flex gap-2">
			{/** rendering duration dropdown filter, engine filter in auditlog if parent is auditlog, and so if client package, it wont render duration filter */}
			{!parent && (
				<>
					<div className="flex min-w-[100px] justify-between">
						<DropdownMenu>
							<DropdownMenuTrigger
								asChild
								className="flex w-[180px] justify-between align-center"
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
												: "Select Engine Type"}{" "}
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
								className="flex w-[180px] justify-between align-center"
							>
								<Button
									variant="outline"
									size="sm"
									className={`flex min-w-[180px] justify-between align-center`}
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
												) ?? "Select Engine"}{" "}
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
			<div className="flex min-w-[100px]">
				<DropdownMenu>
					<DropdownMenuTrigger
						asChild
						className="flex w-[180px] justify-between align-center"
					>
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
										key={`duration-${duration.value}`}
										checked={
											duration.value === dashboardDuration
										}
										onCheckedChange={() => {
											setDashboardDuration(
												duration.value,
											);
											if (duration.value === "custom") {
												setShowCustomPopover(true);
											} else {
												if (showCustomPopover)
													setShowCustomPopover(false);
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
			{/**
			 * Added calendar option newly to filter for handling Custom date range filtering
			 */}
			{renderCustomDatePopover()}
		</div>
	);
};
