import { Delete, Edit, PlayArrow } from "@mui/icons-material";
import {
	DataGrid,
	type GridColDef,
	type GridRowSelectionModel,
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
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

const LoadingOverlay = () => {
	return <LinearProgress color="primary" />;
};

export const JobsTable = (props: {
	jobs: Job[];
	jobsLoading: boolean;
	rowSelectionModel: GridRowSelectionModel;
	setRowSelectionModel: (value: GridRowSelectionModel) => void;
	getHistory: () => void;
	setInitialBuilderState: (builder: JobBuilder) => void;
	showDeleteJobModal: (job: Job) => void;
}) => {
	const {
		jobs,
		jobsLoading,
		rowSelectionModel,
		setRowSelectionModel,
		getHistory,
		setInitialBuilderState,
		showDeleteJobModal,
	} = props;
	const notification = useNotification();

	const [runJobLoading, setRunJobLoading] = useState<boolean>(false);

	const runJob = async (job: Job) => {
		setRunJobLoading(true);
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
			await getHistory();
		} catch {
			notification.add({
				color: "error",
				message: "Could not retrieve job history.",
			});
		}
		setRunJobLoading(false);
	};

	const JobColumns: GridColDef[] = [
		{
			headerName: "Name",
			field: "name",
			flex: 1,
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
				return params.value ? "Active" : "Paused";
			},
		},
		{
			headerName: "Modified By",
			field: "ownerId",
			flex: 1,
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
				return (
					<>
						<IconButton
							disabled={runJobLoading}
							color="primary"
							size="medium"
							onClick={() => {
								job && runJob(job);
							}}
							data-testid={"jobsTable-play-btn"}
						>
							{runJobLoading ? (
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
							disabled={runJobLoading}
							onClick={() => {
								setInitialBuilderState({
									id: job.id,
									name: job.name,
									pixel: job.pixel,
									tags: job.tags,
									cronExpression:
										job.cronExpression.replaceAll("?", "*"),
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
								});
							}}
							data-testid={"jobsTable-edit-btn"}
						>
							<Edit />
						</IconButton>
						<IconButton
							disabled={runJobLoading}
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
