import { CheckCircle2, Info, XCircle } from "lucide-react";
import {
	getErrorMessage,
	hasTabularData,
	isErrorResponse,
	type QueryResult,
} from "./use-database-query-execution";

export function useQueryResults() {
	const renderResults = (
		previewData: QueryResult | null,
		previewLimit: number,
		_isExpanded: boolean = false,
	) => {
		if (!previewData) {
			return (
				<div className="flex h-full items-center justify-center">
					<span className="text-muted-foreground text-sm">
						Click "RUN" to see query results here
					</span>
				</div>
			);
		}

		if (isErrorResponse(previewData)) {
			const errorMessage = getErrorMessage(previewData);
			return (
				<div className="p-4">
					<div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
						<XCircle className="mt-0.5 size-4 shrink-0" />
						<div>
							<p className="font-semibold text-sm">Query Error</p>
							<p className="mt-1 whitespace-pre-wrap text-sm">
								{errorMessage}
							</p>
						</div>
					</div>
				</div>
			);
		}

		if (previewData.queryType && previewData.queryType !== "SELECT") {
			const isSuccess = previewData.isSuccess !== false;
			return (
				<div className="p-4">
					<div
						className={`mb-4 flex items-start gap-2 rounded-md border p-3 ${
							isSuccess
								? "border-green-300 bg-green-50 text-green-700"
								: "border-yellow-300 bg-yellow-50 text-yellow-700"
						}`}
					>
						{isSuccess ? (
							<CheckCircle2 className="mt-0.5 size-4 shrink-0" />
						) : (
							<Info className="mt-0.5 size-4 shrink-0" />
						)}
						<p className="font-semibold text-sm">
							{isSuccess
								? "Statement Executed"
								: "Statement Completed"}
						</p>
					</div>

					<div className="mb-4 rounded-md bg-muted/50 p-2 text-xs">
						<span>
							Execution time: {previewData.timeToRun || 0}ms
						</span>
						{previewData.queryText && (
							<span className="block">
								Query: {previewData.queryText}
							</span>
						)}
						{previewData.operationType && (
							<span className="block">
								Operation:{" "}
								{Array.isArray(previewData.operationType)
									? previewData.operationType.join(", ")
									: previewData.operationType}
							</span>
						)}
					</div>

					{previewData.output && (
						<div className="mt-2">
							<span className="mb-1 block font-semibold text-xs">
								Database Response:
							</span>
							<div className="max-h-[200px] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/50 p-2 font-mono text-xs">
								{typeof previewData.output === "string"
									? previewData.output
									: JSON.stringify(
											previewData.output,
											null,
											2,
										)}
							</div>
						</div>
					)}
				</div>
			);
		}

		if (hasTabularData(previewData)) {
			const headers = previewData.output.data.headers || [];
			const values = (previewData.output.data.values || []).slice(
				0,
				previewLimit,
			);

			return (
				<div
					className="h-full w-full overflow-auto p-4 pt-0 pb-4"
					data-testid="query-results-table-container"
				>
					<table
						className="border-none text-left"
						style={{ width: "max-content", minWidth: "100%" }}
						aria-label="sticky table"
						data-testid="query-results-table"
					>
						{headers.length > 0 && (
							<thead className="sticky top-0 z-[1] border-border border-b bg-muted/80 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
								<tr>
									{headers.map((header: string) => (
										<th
											key={`header-${header}`}
											className="min-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap bg-transparent p-2 font-bold text-muted-foreground text-xs"
										>
											{header}
										</th>
									))}
								</tr>
							</thead>
						)}
						{values && (
							<tbody data-testid="query-results-table-body">
								{values.length === 0 ? (
									<tr>
										<td
											colSpan={headers.length}
											className="border-border border-b p-6 text-center text-muted-foreground text-sm"
										>
											No data returned
										</td>
									</tr>
								) : (
									values.map((row: unknown[]) => (
										<tr
											key={`row-${headers
												.map((header, columnIndex) => {
													const cell =
														row[columnIndex];
													return `${header}:${String(cell ?? "(null)")}`;
												})
												.join("|")}`}
											className="border-border border-b hover:bg-muted/50"
										>
											{headers.map(
												(
													header: string,
													columnIndex: number,
												) => {
													const cell =
														row[columnIndex];
													return (
														<td
															key={`${header}-${String(cell ?? "(null)")}`}
															className="min-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap p-2 text-xs"
														>
															{cell !== null &&
															cell !== undefined
																? String(cell)
																: "(null)"}
														</td>
													);
												},
											)}
										</tr>
									))
								)}
							</tbody>
						)}
					</table>
				</div>
			);
		}

		return (
			<div className="p-4">
				<div className="mb-4 flex items-start gap-2 rounded-md border border-primary/25 bg-primary/10 p-3 text-primary">
					<Info className="mt-0.5 size-4 shrink-0" />
					<div>
						<p className="font-semibold text-sm">Query Executed</p>
						<p className="mt-1 text-sm">
							The query was executed successfully but returned no
							tabular data
						</p>
					</div>
				</div>

				<div className="rounded-md bg-muted/50 p-2 text-xs">
					<span>Execution time: {previewData.timeToRun || 0}ms</span>
					{previewData.queryText && (
						<span className="block">
							Query: {previewData.queryText}
						</span>
					)}
				</div>

				{previewData.output && (
					<div className="mt-2">
						<span className="mb-1 block font-semibold text-xs">
							Raw Output:
						</span>
						<pre className="max-h-[150px] overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/40 p-2 text-[11px]">
							{typeof previewData.output === "string"
								? previewData.output
								: JSON.stringify(previewData.output, null, 2)}
						</pre>
					</div>
				)}
			</div>
		);
	};

	return renderResults;
}
