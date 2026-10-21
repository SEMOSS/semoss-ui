import { AlertCircle, Download } from "lucide-react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	P,
	Small,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { DatabaseStatementResult } from "@/stores/workbench/database/database-workbench.store";

/** Each statement status in words. */
const STATUS_LABELS: Record<DatabaseStatementResult["status"], string> = {
	SUCCESS: "Success",
	ERROR: "Error",
	SKIPPED: "Skipped",
	ROLLED_BACK: "Rolled back",
};

/** Props for {@link DatabaseStatementResultView}. */
export interface DatabaseStatementResultViewProps {
	/** Parsed and eagerly collected result for one statement in a SQL batch. */
	result: DatabaseStatementResult;
	/** Whether CSV export is supported by the current database workbench mode. */
	canExport: boolean;
	/** Whether this statement is currently being exported. */
	isExporting: boolean;
	/** Exports this statement's table result. */
	onExport: (result: DatabaseStatementResult) => void;
}

/**
 * Renders one statement of a SQL script's result: a script of several
 * statements, or any script run in one transaction.
 */
export const DatabaseStatementResultView = ({
	result,
	canExport,
	isExporting,
	onExport,
}: DatabaseStatementResultViewProps) => (
	<div className="flex h-full min-h-0 flex-col gap-2">
		<div className="flex flex-none items-start gap-2 rounded-md border border-border bg-muted/30 p-2">
			<Badge
				variant={result.status === "ERROR" ? "destructive" : "outline"}
			>
				{STATUS_LABELS[result.status]}
			</Badge>
			<code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-foreground text-xs leading-relaxed">
				{result.query}
			</code>
		</div>

		{result.type === "TABLE" && result.status === "ROLLED_BACK" && (
			<P className="flex-none text-muted-foreground text-xs">
				These rows were read inside the transaction, which was then
				rolled back, so none of its changes were kept.
			</P>
		)}

		{/* keeps a few rows visible even in a short panel, which then scrolls */}
		<div className="min-h-32 flex-1 overflow-hidden">
			{result.type === "TABLE" && (
				<Table wrapperClassName="h-full w-full rounded-md border border-border overflow-auto">
					<TableHeader className="sticky top-0 z-10 bg-secondary">
						<TableRow>
							{result.output.headers.map((header) => (
								<TableHead key={header}>{header}</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{result.output.values.map((row, rowIdx) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: database rows have no natural unique key
							<TableRow key={rowIdx}>
								{row.map((cell, cellIdx) => (
									<TableCell
										key={result.output.headers[cellIdx]}
									>
										{String(cell ?? "")}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
			{result.type === "MESSAGE" && (
				<div className="flex h-full items-center justify-center overflow-auto p-2">
					<P>{result.message}</P>
				</div>
			)}
			{result.type === "ERROR" && (
				<Alert variant="destructive">
					<AlertCircle aria-hidden />
					<AlertTitle>Statement failed</AlertTitle>
					<AlertDescription>
						{result.message}
						{result.sqlState && (
							<span className="block">
								SQLState {result.sqlState}
							</span>
						)}
					</AlertDescription>
				</Alert>
			)}
			{result.type === "SKIPPED" && (
				<Alert>
					<AlertTitle>Statement skipped</AlertTitle>
					<AlertDescription>{result.message}</AlertDescription>
				</Alert>
			)}
		</div>

		<div className="flex flex-none items-center">
			{result.type === "TABLE" && canExport && (
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<span
							className="inline-flex"
							tabIndex={isExporting ? 0 : undefined}
						>
							<Button
								disabled={isExporting}
								variant="outline"
								size="icon-sm"
								onClick={() => onExport(result)}
								aria-label={`Export statement ${result.statement} results`}
							>
								{isExporting ? (
									<Spinner />
								) : (
									<Download aria-hidden />
								)}
							</Button>
						</span>
					</TooltipTrigger>
					<TooltipContent>
						{isExporting
							? "Exporting results…"
							: "Export statement results"}
					</TooltipContent>
				</Tooltip>
			)}
			<div className="flex-1" />
			<div className="flex items-center gap-4">
				{result.type === "TABLE" && result.hasMoreRows && (
					<Small className="font-medium">
						{result.output.values.length === 1
							? "First row shown"
							: `First ${result.output.values.length} rows shown`}
					</Small>
				)}
				{result.updateCount !== undefined && (
					<Small className="font-medium">
						Rows changed: {result.updateCount}
					</Small>
				)}
				<Small className="font-medium">
					Statement time: {result.timeToRun}ms
				</Small>
			</div>
		</div>
	</div>
);
