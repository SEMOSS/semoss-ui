import { AlertCircle } from "lucide-react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Code,
	CodeContainer,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import type {
	DatabaseQueryResult,
	DatabaseStatementResult,
} from "@/api/database";

interface DatabaseResultsViewProps {
	result: DatabaseQueryResult | null;
}

const ResultTable = ({
	headers,
	values,
}: {
	headers: string[];
	values: unknown[][];
}) => (
	<Table wrapperClassName="h-full w-full overflow-auto border-0">
		<TableHeader className="sticky top-0 z-10 bg-secondary">
			<TableRow>
				{headers.map((header) => (
					<TableHead key={header}>{header}</TableHead>
				))}
			</TableRow>
		</TableHeader>
		<TableBody>
			{values.map((row, rowIndex) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: database rows have no stable identity
				<TableRow key={rowIndex}>
					{row.map((cell, cellIndex) => (
						<TableCell key={`${headers[cellIndex]}-${cellIndex}`}>
							{String(cell ?? "")}
						</TableCell>
					))}
				</TableRow>
			))}
		</TableBody>
	</Table>
);

const StatementResult = ({ result }: { result: DatabaseStatementResult }) => {
	if (result.type === "TABLE") {
		return (
			<ResultTable
				headers={result.output.headers}
				values={result.output.values}
			/>
		);
	}
	if (result.type === "ERROR") {
		return (
			<Alert variant="destructive" className="m-3">
				<AlertCircle aria-hidden="true" />
				<AlertTitle>Statement failed</AlertTitle>
				<AlertDescription>{result.message}</AlertDescription>
			</Alert>
		);
	}
	return <p className="whitespace-pre-wrap p-4 text-sm">{result.message}</p>;
};

export const DatabaseResultsView = ({ result }: DatabaseResultsViewProps) => {
	if (!result) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground text-sm">
				Run a query to view results.
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2">
			<div className="min-h-0 flex-1 overflow-hidden">
				{result.type === "ERROR" ? (
					<Alert variant="destructive">
						<AlertCircle aria-hidden="true" />
						<AlertTitle>Query failed</AlertTitle>
						<AlertDescription>{result.message}</AlertDescription>
					</Alert>
				) : null}
				{result.type === "TABLE" ? (
					<ResultTable
						headers={result.output.headers}
						values={result.output.values}
					/>
				) : null}
				{result.type === "MESSAGE" ? (
					<p className="whitespace-pre-wrap p-4 text-sm">
						{result.message}
					</p>
				) : null}
				{result.type === "JSON" ? (
					<div className="h-full overflow-auto p-3">
						<CodeContainer>
							<Code
								code={JSON.stringify(result.output, null, 2)}
								language="json"
							/>
						</CodeContainer>
					</div>
				) : null}
				{result.type === "BATCH" ? (
					<Tabs
						defaultValue={`statement-${result.results[0]?.statement ?? 1}`}
						className="h-full min-h-0"
					>
						<div className="overflow-x-auto border-border border-b px-2 pt-2">
							<TabsList>
								{result.results.map((statement) => (
									<TabsTrigger
										key={statement.statement}
										value={`statement-${statement.statement}`}
									>
										{statement.statement} ·{" "}
										{statement.route}
									</TabsTrigger>
								))}
							</TabsList>
						</div>
						{result.results.map((statement) => (
							<TabsContent
								key={statement.statement}
								value={`statement-${statement.statement}`}
								className="min-h-0 overflow-auto"
							>
								<StatementResult result={statement} />
							</TabsContent>
						))}
					</Tabs>
				) : null}
			</div>
			<div className="flex shrink-0 items-center justify-end">
				<p className="font-medium text-xs">
					Total execution time:{" "}
					<span className="text-foreground">
						{result.timeToRun || 0}ms
					</span>
				</p>
			</div>
		</div>
	);
};
