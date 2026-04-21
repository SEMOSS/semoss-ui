import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge, Button } from "@semoss/ui/next";

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
			<tr className="border-t hover:bg-muted/30">
				<td className="px-2 py-1">
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						onClick={() => setOpen(!open)}
						data-testid={"historyRow-table-toggle-btn"}
					>
						{open ? (
							<ChevronDown className="size-4" />
						) : (
							<ChevronRight className="size-4" />
						)}
					</Button>
				</td>
				<td className="px-3 py-2 text-sm">{row.jobName}</td>
				<td className="px-3 py-2 text-sm">{row.execStart}</td>
				<td className="px-3 py-2 text-sm">{row.execDelta}</td>
				<td className="px-3 py-2 text-sm">
					<Badge
						variant="outline"
						className={
							row.success
								? "border-green-500 text-green-600"
								: "border-red-500 text-red-600"
						}
					>
						{row.success ? "Success" : "Failed"}
					</Badge>
				</td>
			</tr>
			{open && (
				<tr className="border-t bg-muted/20">
					<td colSpan={5} className="px-4 py-3">
						<p className="mb-2 font-medium text-sm">Output:</p>
						<div className="rounded-2xl bg-[#F0F0F0] p-2 text-sm">
							{row.schedulerOutput}
						</div>
					</td>
				</tr>
			)}
		</>
	);
};
