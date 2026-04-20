import { Button, Stack } from "@mui/material";
import { Download } from "lucide-react";
import type * as React from "react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import ExcelIcon from "./file-excel-solid-full.svg";

function Table({ className, ...props }: React.ComponentProps<"table">) {
	const id = `${Math.random() * 1000}`;
	return (
		<div>
			<Button
				variant="contained"
				style={{
					float: "right",
					marginBottom: "5px",
					background: "#007cba",
				}}
				//color="#007cba"
				onClick={() => {
					const today = new Date();

					const formattedDate = today.toISOString().slice(0, 10);
					const fileName = `table_response_${formattedDate}.xlsx`;
					exportTableByIdToExcel(id, fileName);
				}}
				size={"large"}
				aria-label="Export to Excel"
				title="Export to Excel"
				sx={{
					textTransform: "none",
					borderRadius: 2,
					px: 1.5,
					gap: 1,
				}}
			>
				<Stack direction="row" alignItems="center" spacing={1}>
					<img
						src={ExcelIcon}
						alt="Export to Excel"
						height="25px"
						width="25px"
					/>
					<Download fontSize="medium" />
				</Stack>
			</Button>

			<div
				data-slot="table-container"
				className="relative w-full overflow-x-auto"
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
	console.log("Exporting table with ID:", id);
	const table = document.getElementById(id);
	if (!table) return;
	const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
	XLSX.writeFile(wb, filename);
}

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
				"h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
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
				"whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
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
