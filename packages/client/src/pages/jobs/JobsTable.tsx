
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Delete, Edit, PlayArrow } from "@mui/icons-material";
import {
	DataGrid,
	type GridColDef,
	type GridRowSelectionModel,
} from "@mui/x-data-grid";
import { runPixel } from "@semoss/sdk/react";
import {
	Chip,
	CircularProgress,
	IconButton,
	LinearProgress,
	Stack,
	styled,
	useNotification,
} from "@semoss/ui";
import type { Job, JobBuilder } from "./job.types";
import { getHumanReadableCronExpression } from "./job.utils";
import Avatar  from "../../assets/img/Avatar.svg";

const StyledDataGrid = styled(DataGrid)(() => ({
	".MuiDataGrid-overlayWrapper": {
		height: "48px",
	},
	".MuiDataGrid-overlayWrapperInner": {
		height: "48px",
	},
	".MuiDataGrid-cell": {
		whiteSpace: "normal!important",
		wordWrap: "break-word!important",
	},
}));

const StyledChip = styled(Chip, { shouldForwardProp: (prop) => prop !== "isActive" })<{ isActive: boolean }>(({ theme, ...props }) => {
	const isActive = (props as any).isActive;
	return {
		fontWeight: 600,
		color: "#fff",
		backgroundColor: isActive ? theme.palette.success.main : theme.palette.error.main,
	};
});

const LoadingOverlay = () => {
	return <LinearProgress color="primary" />;
};

export const JobsTable = (props: {
	jobs: Job[];
	jobsLoading: boolean;
	rowSelectionModel: GridRowSelectionModel;
	setRowSelectionModel: (value: GridRowSelectionModel) => void;
	getHistory: () => void;
	showDeleteJobModal: (job: Job) => void;
	getFailedJobCount: () => void;
}) => {
	const {
		jobs,
		jobsLoading,
		rowSelectionModel,
		setRowSelectionModel,
		getHistory,
		showDeleteJobModal,
		getFailedJobCount,
	} = props;
	const notification = useNotification();
	const navigate = useNavigate();

	const [runJobLoading, setRunJobLoading] = useState<Set<string>>(new Set());

	const runJob = async (job: Job) => {
		setRunJobLoading(prev => new Set(prev).add(job.id));
		try {
			await runPixel(
				`META | ExecuteScheduledJob ( jobId = [ "${job.id}" ] , jobGroup = [ "${job.group}" ] ) ;`,
			);
		} catch {
			notification.add({
				color: "error",
				message: "Job could not be executed.",
			});
		}
		try {
			await getFailedJobCount();
		} catch {
			notification.add({
				color: "error",
				message: "Could not retrieve failed job count.",
			});
		}
		try {
			await getHistory();
		} catch {
			notification.add({
				color: "error",
				message: "Could not retrieve job history.",
			});
		} finally {
			setRunJobLoading(prev => {
				const newSet = new Set(prev);
				newSet.delete(job.id);
				return newSet;
			});
		}
	};

	const JobColumns: GridColDef[] = [
		{
			headerName: "Name",
			field: "name",
			flex: 1,
			renderCell: (params) => (
				<div
					style={{
						width: "100%",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
					title={params.value}
				>
					{params.value}
				</div>
			),
		},
		{
			headerName: "Frequency",
			field: "cronExpression",
			flex: 1,
			renderCell: (params) => {
				return (
					<>
						{getHumanReadableCronExpression(
							params.value.replaceAll("?", "*"),
						)}
					</>
				);
			},
		},
		{
			headerName: "Time Zone",
			field: "timeZone",
			flex: 1,
		},
		{
			headerName: "Tags",
			field: "tags",
			flex: 1,
			sortable: false,
			disableColumnMenu: true,
			renderCell: (params) => {
				return (
					<Stack
						height="100%"
						direction="row"
						spacing={1}
						alignItems="center"
					>
						{params.value.map((tag) => {
							if (tag) {
								return (
									<Chip
										key={`test-${params?.row?.id}-${tag}`}
										label={tag}
									/>
								);
							}
							return null;
						})}
					</Stack>
				);
			},
		},
		{
			headerName: "Last Run",
			field: "lastRun",
			flex: 1,
			minWidth: 200,
			renderCell: (params) => {
				let time = "";
				if (
					!(
						!params.value ||
						params.value === "N/A" ||
						params.value === "INACTIVE"
					)
				) {
					time = dayjs(params.value).format("MM/DD/YYYY h:MM A");
				}
				return <>{time}</>;
			},
		},
		{
			headerName: "Status",
			field: "isActive",
			flex: 1,
			renderCell: (params) => {
				return (
						<StyledChip
							label={params.value ? "Active" : "Inactive"}
							isActive={params.value}
						/>
					);
			},
		},
		{
			headerName: "Modified By",
			field: "ownerId",
			flex: 1,
			renderCell: (params) => {
				return (
					<Stack direction="row" alignItems="center" spacing={1}>
						<img
							src={Avatar}
							alt="Avatar"
							style={{ width: 24, height: 24, borderRadius: "50%" }}
						/>
						<span>{params.value}</span>
					</Stack>
				);
			},
		},
		{
			headerName: "Actions",
			field: "id",
			flex: 1,
			sortable: false,
			disableColumnMenu: true,
			minWidth: 150,
			renderCell: (params) => {
				const job = jobs?.find((job) => job.id === params?.value);
				const isJobRunning = runJobLoading.has(params?.value);
				return (
					<>
						<IconButton
							disabled={isJobRunning}
							color="primary"
							size="medium"
							onClick={() => {
								job && runJob(job);
							}}
							data-testid={"jobsTable-play-btn"}
						>
							{isJobRunning ? (
								<CircularProgress
									size="0.75em"
									variant="indeterminate"
								/>
							) : (
								<PlayArrow />
							)}
						</IconButton>
						<IconButton
							color="primary"
							size="medium"
							disabled={isJobRunning}
							onClick={() => {
								navigate(`/settings/edit-job/${job?.id}`, {
									state: {
										initialState: {
											formType: "edit",
											id: job.id,
											name: job.name,
											pixel: job.pixel,
											tags: job.tags,
											basicTz: job.basicTz,
											cronExpression: job.cronExpression,
											cronTz: job.timeZone,
											smtpHost: job.smtpHost,
											smtpPort: job.smtpPort,
											subject: job.subject,
											jobType: job.jobType,
											to: job.to,
											cc: job.cc,
											bcc: job.bcc,
											from: job.from,
											message: job.message,
											username: job.username,
											password: job.password,
											timeZone: job.timeZone,
										}}
								});
							}}
							data-testid={"jobsTable-edit-btn"}
						>
							<Edit />
						</IconButton>
						<IconButton
							disabled={isJobRunning}
							color="error"
							size="medium"
							onClick={() => {
								showDeleteJobModal(job);
							}}
							data-testid={"jobsTable-delete-btn"}
						>
							<Delete />
						</IconButton>
					</>
				);
			},
		},
	];

	// reset selections when jobs change
	useEffect(() => {
		setRowSelectionModel([]);
	}, [jobs]);

	return (
		<StyledDataGrid
			columns={JobColumns}
			rows={jobs}
			checkboxSelection
			disableRowSelectionOnClick
			rowSelectionModel={rowSelectionModel}
			onRowSelectionModelChange={(value) => setRowSelectionModel(value)}
			slots={{
				loadingOverlay: LoadingOverlay,
				// loadingOverlay: LinearProgress as GridSlots['loadingOverlay'],
				noRowsOverlay: () => (
					<Stack
						height="100%"
						alignItems="center"
						justifyContent="center"
					>
						No jobs found
					</Stack>
				),
			}}
			loading={jobsLoading}
		/>
	);
};
