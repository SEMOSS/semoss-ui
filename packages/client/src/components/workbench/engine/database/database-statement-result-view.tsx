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

interface DatabaseStatementResultViewProps {
	/** Parsed and eagerly collected result for one statement in a SQL batch. */
	result: DatabaseStatementResult;
	/** Whether CSV export is supported by the current database workbench mode. */
	canExport: boolean;
	/** Whether this statement is currently being exported. */
	isExporting: boolean;
	/** Exports this statement's table result. */
	onExport: (result: DatabaseStatementResult) => void;
}

/** Renders one statement from a multi-statement SQL result. */
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
				{result.status}
			</Badge>
			<code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-foreground text-xs leading-relaxed">
				{result.query}
			</code>
		</div>

		<div className="min-h-0 flex-1 overflow-hidden">
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
					<AlertDescription>{result.message}</AlertDescription>
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
				<Tooltip>
					<TooltipTrigger asChild>
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
					</TooltipTrigger>
					<TooltipContent>Export statement results</TooltipContent>
				</Tooltip>
			)}
			<div className="flex-1" />
			<Small className="font-medium">
				Statement time: {result.timeToRun}ms
			</Small>
		</div>
	</div>
);
