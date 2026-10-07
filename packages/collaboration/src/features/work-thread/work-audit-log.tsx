import { Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	AuditLogFilter,
	type AuditLogReportParams,
	AuditLogsDataTable,
	AuditLogsSummary,
	AuditLogsTimeline,
	buildAuditLogReportPixel,
	filterValueToReportParams,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { exportThreadAudit, threadAuditSchema } from "./api/work-activity";
import { useWorkThread } from "./work-thread-context";
/** Room-scoped audit report with server-side filters and explicit export. */
export function WorkAuditLog({ roomId }: { roomId: string }) {
	const { session } = useWorkThread();
	const scope = { roomId };
	const [params, setParams] = useState<AuditLogReportParams>({ scope });
	const [pagination, setPagination] = useState({ page: 0, size: 50 });
	const [exportError, setExportError] = useState("");
	const [isExporting, setIsExporting] = useState(false);
	const query = usePixel<unknown>(
		buildAuditLogReportPixel(
			{ ...params, scope },
			pagination.size,
			pagination.page * pagination.size,
		),
	);
	const result = threadAuditSchema.safeParse(query.data);
	const isLoading = query.status === "INITIAL" || query.status === "LOADING";
	const error =
		query.error?.message ||
		(query.status === "SUCCESS" && !result.success
			? "Activity returned an unexpected response."
			: "");
	const handleExport = async (pdf: boolean): Promise<void> => {
		if (isExporting) return;
		setIsExporting(true);
		setExportError("");
		try {
			await exportThreadAudit(
				session.insight.actions,
				session.insight.insightId,
				{ ...params, scope },
				result.success ? result.data.totalCount : 0,
				pdf,
			);
		} catch (cause) {
			setExportError(
				cause instanceof Error
					? cause.message
					: "Could not export activity.",
			);
		} finally {
			setIsExporting(false);
		}
	};
	return (
		<div className="min-w-0 space-y-4">
			<AuditLogFilter
				insightId={session.insight.insightId}
				parent="client"
				scope={scope}
				hideRoomFilter
				hideDateFilter
				runFilterPixel={session.insight.actions.run}
				updateLogs={(value) => {
					setParams({
						...filterValueToReportParams(value, {
							includeDate: false,
						}),
						scope,
					});
					setPagination((current) => ({ ...current, page: 0 }));
				}}
				actions={
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="icon"
									aria-label="Export activity"
									disabled={
										isExporting ||
										isLoading ||
										Boolean(error)
									}
								>
									<Download aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem
									onSelect={() => void handleExport(false)}
								>
									Export CSV
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={() => void handleExport(true)}
								>
									Export PDF
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Button
							type="button"
							variant="outline"
							size="icon"
							aria-label="Refresh activity"
							disabled={isLoading}
							onClick={query.refresh}
						>
							<RefreshCw aria-hidden="true" />
						</Button>
					</>
				}
			/>
			{isExporting && <output>Preparing export…</output>}
			{exportError && (
				<Alert variant="destructive">
					<AlertDescription>{exportError}</AlertDescription>
				</Alert>
			)}
			{isLoading ? (
				<Skeleton className="h-40 w-full" />
			) : error ? (
				<Alert variant="destructive">
					<AlertDescription>
						{error}
						<Button
							type="button"
							variant="outline"
							onClick={query.refresh}
						>
							Retry activity
						</Button>
					</AlertDescription>
				</Alert>
			) : (
				result.success && (
					<>
						{result.data.totalCount === 0 ? (
							<P className="text-muted-foreground">
								No activity matches these filters.
							</P>
						) : (
							<>
								<AuditLogsSummary
									logs={result.data.logs}
									totalCount={result.data.totalCount}
								/>
								<AuditLogsTimeline logs={result.data.logs} />
							</>
						)}
						<div className="min-w-0 overflow-x-auto">
							<AuditLogsDataTable
								logs={result.data.logs}
								totalCount={result.data.totalCount}
								page={pagination.page}
								rowsPerPage={pagination.size}
								onPaginationChange={(page, size) =>
									setPagination({ page, size })
								}
							/>
						</div>
					</>
				)
			)}
		</div>
	);
}
