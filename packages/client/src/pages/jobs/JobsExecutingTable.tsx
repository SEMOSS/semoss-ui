import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { LinearProgress, Stack, styled } from "@semoss/ui";
import type { ExecutingJob } from "./job.types";

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

const formatElapsed = (ms) => {
	const totalSeconds = Math.floor(ms / 1000);
	const seconds = totalSeconds % 60;
	const minutes = Math.floor(totalSeconds / 60) % 60;
	const hours = Math.floor(totalSeconds / 3600) % 24;
	const days = Math.floor(totalSeconds / (3600 * 24));
	return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

export const JobsExecutingTable = (props: {
	jobs: ExecutingJob[];
	jobsLoading: boolean;
}) => {
	const { jobs, jobsLoading } = props;
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const i = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(i);
	}, []);

	const JobColumns: GridColDef[] = [
		{
			headerName: "Name",
			field: "jobName",
			flex: 1,
		},
		{
			headerName: "Last Run",
			field: "execStart",
			flex: 1,
			minWidth: 200,
			renderCell: (params) => {
				return (
					<>
						{dayjs(params.row.execStart).format(
							"MM/DD/YYYY h:mm A",
						)}
					</>
				);
			},
		},
		{
			headerName: "Time Spent Running",
			field: "runTime",
			flex: 1,
			sortable: false,
			disableColumnMenu: true,
			renderCell: (params) => {
				return <>{formatElapsed(now - params.row.execStart)}</>;
			},
		},
	];

	return (
		<StyledDataGrid
			columns={JobColumns}
			rows={jobs}
			disableRowSelectionOnClick
			slots={{
				loadingOverlay: LoadingOverlay,
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
