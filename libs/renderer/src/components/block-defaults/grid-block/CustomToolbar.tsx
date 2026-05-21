import { FileDown } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";

interface CustomToolbarProps {
	frameName?: string;
	isBatchingEnabled: boolean;
	onExportCsv: () => void;
}

export const CustomToolbar = ({
	frameName,
	isBatchingEnabled,
	onExportCsv,
}: CustomToolbarProps) => {
	return (
		<div
			className="flex items-center gap-2 border-b px-2 py-2"
		>
			<div style={{ flex: 1 }} />
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={onExportCsv}
						>
							<FileDown className="mr-1.5 size-4" />
							Export
						</Button>
					</TooltipTrigger>
					<TooltipContent>Export CSV</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
};
