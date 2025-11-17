import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import dayjs from "dayjs";
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

export const JobsExecutingTable = (props: {
	jobs: ExecutingJob[];
	jobsLoading: boolean;
}) => {
	const { jobs, jobsLoading } = props;

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
				return <>{dayjs(params.value).format("MM/DD/YYYY h:MM A")}</>;
			},
		},
		//  {
		//   headerName: "Time Spent Running",
		//   field: "execDelta",
		//   flex: 1,
		//   sortable: false,
		//   disableColumnMenu: true,
		// },
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
