import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button, TableCell, TableRow } from "@semoss/ui/next";

export const HistoryRow = (props: {
	row: {
		jobName: string;
		execStart: string;
		execDelta: string;
		success: boolean;
		schedulerOutput: string;
	};
}) => {
	const { row } = props;
	const [open, setOpen] = useState(false);

	return (
		<>
			<TableRow>
				<TableCell>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setOpen(!open)}
							data-testid="historyRow-table-toggle-btn"
						>
							{open ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</Button>

						<span className="text-sm">{row.jobName}</span>
					</div>
				</TableCell>

				<TableCell className="text-xs">{row.execStart}</TableCell>
				<TableCell className="text-xs">{row.execDelta}</TableCell>

				<TableCell>
					<span
						className={`rounded-full px-4 py-2 font-semibold text-white text-xs ${
							row.success ? "bg-green-600" : "bg-red-600"
						}`}
					>
						{row.success ? "Success" : "Failed"}
					</span>
				</TableCell>
			</TableRow>

			{open && (
				<TableRow>
					<TableCell colSpan={6} className="p-0">
						<div className="space-y-3 p-4">
							<p className="font-medium text-sm">Output:</p>

							<div className="rounded-xl bg-gray-100 p-3 text-sm">
								{row.schedulerOutput}
							</div>
						</div>
					</TableCell>
				</TableRow>
			)}
		</>
	);
};
