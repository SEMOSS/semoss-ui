import { RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { AuditLogsDataTable, AuditLogsTimeline } from "@semoss/shared";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
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
			// window.location.hash.split("/")[catalogName === "Apps" ? 2 : 3];
			catalogName = engineSelectionDetails.engineType;
			const response = await runPixel(
				`AuditLogReport(paramValues=[{"userId": "${rootStore?.user?.id}", "${catalogName === "APP" ? "projectId" : "engineId"}": "${catalogId}","dateTime":"${dateTime}","limit":"${limit}","offset":"${offset}"}]);`,
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
	]);

	const renderFilterSection = useCallback(() => {
		return (
			<div className="flex gap-2">
				<div className="min-w-[100px]">
					<Select
						value={engineSelectionDetails.engineType}
						onValueChange={(value) =>
							setEngineSelectionDetails({
								...engineSelectionDetails,
								engineType: value,
								engineId: "",
							})
						}
					>
						<SelectTrigger className="min-w-[180px]">
							<SelectValue placeholder="Select Engine Type" />
						</SelectTrigger>
						<SelectContent>
							{ENGINE_TYPES.map((engineType) => (
								<SelectItem
									value={engineType}
									key={`${engineType}Selection`}
								>
									{engineType}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="min-w-[100px]">
					<Select
						value={engineSelectionDetails.engineId}
						onValueChange={(value) => {
							setEngineSelectionDetails({
								...engineSelectionDetails,
								engineId: value,
							});
						}}
					>
						<SelectTrigger className="min-w-[180px]">
							<SelectValue placeholder={`Select Engine`} />
						</SelectTrigger>
						<SelectContent>
							{engineSelectionDetails.engineType &&
							engineDetails[engineSelectionDetails.engineType]
								.length > 0
								? engineDetails[
										engineSelectionDetails.engineType
									].map((engine) => (
										<SelectItem
											value={engine.value}
											key={engine.value}
										>
											{engine.label}
										</SelectItem>
									))
								: null}
						</SelectContent>
					</Select>
				</div>
			</div>
		);
	}, [engineSelectionDetails, engineDetails]);

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
					<Button
						variant="default"
						onClick={() =>
							fetchLogs(rowsPerPage, page * rowsPerPage)
						}
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
