import { Download } from "lucide-react";
import type * as React from "react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { Button } from "@/next/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/next/tooltip";

function Table({
	className,
	wrapperClassName,
	showExportButton,
	...props
}: React.ComponentProps<"table"> & {
	wrapperClassName?: string;
	showExportButton?: boolean;
}) {
	const id = `table-${Math.random() * 1000}`;

	return (
		<div
			data-slot="table-container"
			className={cn("relative w-full overflow-x-auto", wrapperClassName)}
		>
			{showExportButton && (
				<div>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									const today = new Date();
									const formattedDate = today
										.toISOString()
										.slice(0, 10);
									const fileName = `table_response_${formattedDate}.xlsx`;
									exportTableByIdToExcel(id, fileName);
								}}
								aria-label="Export to Excel"
								title="Export to Excel"
								className="rounded-md bg-background"
							>
								<Download fontSize="medium" />
							</Button>
						</TooltipTrigger>
						<TooltipContent
							side="left"
							className="bg-black text-white"
						>
							Export to Excel
						</TooltipContent>
					</Tooltip>
				</div>
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
				"h-10 whitespace-nowrap px-2 text-start align-middle font-medium text-foreground [&:has([role=checkbox])]:pe-0 *:[[role=checkbox]]:translate-y-0.5",
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
				"whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pe-0 *:[[role=checkbox]]:translate-y-0.5",
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
