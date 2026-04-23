import {
	type GridApi,
	GridToolbarContainer,
	GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { FileDown } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";

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
			style={{
				padding: "8px",
				borderBottom: "1px solid rgba(224, 224, 224, 1)",
				display: "flex",
				alignItems: "center",
				gap: "8px",
			}}
		>
			{isBatchingEnabled && <GridToolbarFilterButton />}
			<div style={{ flex: 1 }} />
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleExportClick}
						>
							<FileDown className="mr-1.5 size-4" />
							Export
						</Button>
					</TooltipTrigger>
					<TooltipContent>Export CSV</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</GridToolbarContainer>
	);
};
