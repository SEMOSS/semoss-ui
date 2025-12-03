import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Tooltip } from "@mui/material";
import {
	type GridApi,
	GridToolbarContainer,
	GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { Button } from "@semoss/ui";

interface CustomToolbarProps {
	apiRef: React.MutableRefObject<GridApi>;
	frameName?: string;
	isBatchingEnabled: boolean;
}

export const CustomToolbar = ({
	apiRef,
	frameName,
	isBatchingEnabled,
}: CustomToolbarProps) => {
	const handleExportClick = () => {
		if (apiRef.current) {
			apiRef.current.exportDataAsCsv({
				fileName: frameName || "grid-export",
			});
		}
	};

	return (
		<GridToolbarContainer
			sx={{
				padding: "8px",
				borderBottom: "1px solid rgba(224, 224, 224, 1)",
				display: "flex",
				alignItems: "center",
				gap: "8px",
			}}
		>
			{isBatchingEnabled && <GridToolbarFilterButton />}
			<div style={{ flex: 1 }} />
			<Tooltip title="Export CSV">
				<Button
					variant="text"
					size="small"
					startIcon={<FileDownloadIcon fontSize="small" />}
					onClick={handleExportClick}
				>
					Export
				</Button>
			</Tooltip>
		</GridToolbarContainer>
	);
};
