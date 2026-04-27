import { Button, Stack } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import type * as React from "react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

interface TableProps extends React.ComponentProps<"table"> {
	showExportButton?: boolean;
}

const ENV_SHOW_EXPORT_BUTTON =
	(import.meta as unknown as { env: Record<string, string> }).env
		.VITE_ENABLE_EXCEL_DOWNLOAD_BUTTON === "true";

function Table({
	className,
	showExportButton = ENV_SHOW_EXPORT_BUTTON,
	...props
}: TableProps) {
	const id = `table-${Math.random() * 1000}`;

	return (
		<div>
			{showExportButton && (
				<Stack
					direction="row"
					spacing={1}
					style={{ float: "right", marginBottom: "5px" }}
				>
					<Tooltip
						title="Export to Excel"
						arrow
						placement="left"
						slotProps={{
							tooltip: {
								sx: {
									bgcolor: "black",
									color: "white",
									fontSize: "0.85rem",
								},
							},
							arrow: {
								sx: {
									color: "black",
								},
							},
						}}
					>
						<Button
							variant="text"
							onClick={() => {
								const today = new Date();
								const formattedDate = today
									.toISOString()
									.slice(0, 10);
								const fileName = `table_response_${formattedDate}.xlsx`;
								exportTableByIdToExcel(id, fileName);
							}}
							size="large"
							aria-label="Export to Excel"
							title="Export to Excel"
							sx={{
								textTransform: "none",
								borderRadius: 2,
								px: 1.5,
								gap: 1,
								minWidth: 0,
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 384 512"
								width="24"
								height="24"
								fill="rgb(177, 137, 80)"
								aria-hidden="true"
							>
								<title>Export to Excel</title>
								<path d="M64 0C28.7 0 0 28.7 0 64v384c0 35.3 28.7 64 64 64h256c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0zm192 0v128h128zM155.7 250.2l36.3 51.9l36.3-51.9c7.6-10.9 22.6-13.5 33.4-5.9s13.5 22.6 5.9 33.4L221.3 344l46.4 66.2c7.6 10.9 5 25.8-5.9 33.4s-25.8 5-33.4-5.9L192 385.8l-36.3 51.9c-7.6 10.9-22.6 13.5-33.4 5.9s-13.5-22.6-5.9-33.4l46.3-66.2l-46.4-66.2c-7.6-10.9-5-25.8 5.9-33.4s25.8-5 33.4 5.9z" />
							</svg>
						</Button>
					</Tooltip>
				</Stack>
			)}

			<div
				data-slot="table-container"
				className="relative w-full overflow-x-auto"
				style={{ clear: "both" }} // Ensures table appears below the buttons
			>
				<table
					id={id}
					data-slot="table"
					className={cn("w-full caption-bottom text-sm", className)}
					{...props}
				/>
			</div>
		</div>
	);
}

function exportTableByIdToExcel(id: string, filename: string): void {
	const table = document.getElementById(id);
	if (!table) {
		console.error(`Table with id "${id}" not found`);
		return;
	}
	try {
		const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
		XLSX.writeFile(wb, filename);
	} catch (error) {
		console.error("Error exporting table:", error);
	}
}

// ... rest of your component functions remain the same
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
	return (
		<thead
			data-slot="table-header"
			className={cn("[&_tr]:border-b", className)}
			{...props}
		/>
	);
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
	return (
		<tbody
			data-slot="table-body"
			className={cn("[&_tr:last-child]:border-0", className)}
			{...props}
		/>
	);
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
	return (
		<tfoot
			data-slot="table-footer"
			className={cn(
				"border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
				className,
			)}
			{...props}
		/>
	);
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
	return (
		<tr
			data-slot="table-row"
			className={cn(
				"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
				className,
			)}
			{...props}
		/>
	);
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
	return (
		<th
			data-slot="table-head"
			className={cn(
				"h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
				className,
			)}
			{...props}
		/>
	);
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
	return (
		<td
			data-slot="table-cell"
			className={cn(
				"whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
				className,
			)}
			{...props}
		/>
	);
}

function TableCaption({
	className,
	...props
}: React.ComponentProps<"caption">) {
	return (
		<caption
			data-slot="table-caption"
			className={cn("mt-4 text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

export type { TableProps };
export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
};
