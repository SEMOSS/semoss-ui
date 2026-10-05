import { RefreshCw, X } from "lucide-react";
import { useState } from "react";
import {
	Button,
	H4,
	Muted,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { defaultUsageFilters } from "@/api/enterprise-usage-requests";
import type {
	UsageFilters as Filters,
	UsageBenchmark,
	UsageDateRange,
	UsageDimension,
} from "./usage.types";
import { UsageFilters } from "./usage-filters";
import { UsageLog } from "./usage-log";
import { UsageOverview } from "./usage-overview";
import { UsageRankings } from "./usage-rankings";

/** Enterprise usage workspace, mounted only after the route's administrator check. */
export function EnterpriseUsage() {
	const [filters, setFilters] = useState<Filters>(() =>
		defaultUsageFilters(),
	);
	const [selectedRange, setSelectedRange] = useState<UsageDateRange | null>(
		null,
	);
	const applied = selectedRange ? { ...filters, ...selectedRange } : filters;
	const handleApply = (next: Filters): void => {
		setFilters(next);
		setSelectedRange(null);
	};
	const clearRange = (): void => setSelectedRange(null);
	const [benchmark, setBenchmark] = useState<UsageBenchmark>({
		mode: "previous-period",
		from: "",
		to: "",
	});
	const [tab, setTab] = useState("overview");
	const [revision, setRevision] = useState(0);
	const queryKey = `${JSON.stringify(applied)}-${revision}`;
	const handleDrill = (dimension: UsageDimension, id: string): void => {
		setFilters((current) => ({
			...current,
			[dimension === "model" ? "engine" : dimension]: `=${id}`,
		}));
		setTab("messages");
	};
	return (
		<div className="min-w-0 space-y-3 pb-4">
			<UsageFilters filters={filters} onApply={handleApply} />
			<section
				aria-label="Applied Filters"
				className="space-y-2 rounded-md border bg-muted/30 p-2"
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<output className="text-xs">
						Applied To All Tabs: {applied.from} - {applied.to} |
						Dates Use Log Database Time.
					</output>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setRevision((value) => value + 1)}
					>
						<RefreshCw aria-hidden="true" />
						Refresh Data
					</Button>
				</div>
				<div className="flex flex-wrap gap-2">
					{selectedRange && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={clearRange}
							aria-label={`Clear Chart Date Filter: ${selectedRange.from} - ${selectedRange.to}`}
							className="h-auto min-h-8 whitespace-normal"
						>
							Chart Date Filter: {selectedRange.from} -{" "}
							{selectedRange.to}
							<X aria-hidden="true" />
						</Button>
					)}
					{(["user", "app", "engine"] as const).map((dimension) =>
						filters[dimension] ? (
							<Button
								key={dimension}
								type="button"
								variant="outline"
								size="sm"
								className="h-auto min-h-8 max-w-full whitespace-normal break-all"
								aria-label={`Clear ${dimension === "user" ? "User" : dimension === "app" ? "App" : "Engine"} ID: ${filters[dimension].replace(/^=/, "")}`}
								onClick={() =>
									setFilters((current) => ({
										...current,
										[dimension]: "",
									}))
								}
							>
								{dimension === "user"
									? "User"
									: dimension === "app"
										? "App"
										: "Engine"}{" "}
								ID: {filters[dimension].replace(/^=/, "")}
								<X aria-hidden="true" />
							</Button>
						) : null,
					)}
				</div>
			</section>
			<Tabs value={tab} onValueChange={setTab} className="min-w-0">
				<TabsList
					aria-label="Enterprise Usage Views"
					className="h-auto flex-wrap justify-start"
				>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="tokens">Token Consumption</TabsTrigger>
					<TabsTrigger value="consumers">
						Users, Apps & Models
					</TabsTrigger>
					<TabsTrigger value="messages">Messages</TabsTrigger>
					<TabsTrigger value="activity">Activity Log</TabsTrigger>
				</TabsList>
				<TabsContent value="overview" className="min-w-0 pt-2">
					<UsageOverview
						key={`activity-${queryKey}`}
						source="activity"
						filters={applied}
						benchmark={benchmark}
						onBenchmark={setBenchmark}
						selectedRange={selectedRange}
						onRange={setSelectedRange}
						onClearRange={clearRange}
					/>
				</TabsContent>
				<TabsContent value="tokens" className="min-w-0 pt-2">
					<UsageOverview
						key={`model-${queryKey}`}
						source="model"
						filters={applied}
						benchmark={benchmark}
						onBenchmark={setBenchmark}
						selectedRange={selectedRange}
						onRange={setSelectedRange}
						onClearRange={clearRange}
					/>
				</TabsContent>
				<TabsContent value="consumers" className="min-w-0 pt-2">
					<UsageRankings
						key={queryKey}
						filters={applied}
						onDrill={handleDrill}
					/>
				</TabsContent>
				<TabsContent value="messages" className="min-w-0 pt-2">
					<UsageLog
						key={`model-${queryKey}`}
						source="model"
						filters={applied}
					/>
				</TabsContent>
				<TabsContent value="activity" className="min-w-0 pt-2">
					<UsageLog
						key={`activity-${queryKey}`}
						source="activity"
						filters={applied}
					/>
				</TabsContent>
			</Tabs>
			<section className="space-y-2 border-t pt-2">
				<H4>About These Metrics</H4>
				<Muted>
					Usage Reflects Retained Logs And Enabled Logging. Model
					Requests Count INPUT Rows; Tokens Count INPUT And RESPONSE
					Rows At Their Respective Logged Times. Model Inference
					Records Include Chat, Embeddings, And Other Model Methods;
					Vector Nearest-Neighbor Logs Are Excluded. App Attribution
					Comes From The Room's Recorded App. Activity Events Come
					From The Separate Activity Database.
				</Muted>
				<Muted>
					Cache And Thinking Token Detail Depends On The Provider.
					Latency Measures The Whole Model Response, Not Time To First
					Token. Feedback Describes Rated Responses Only. These Logs
					Do Not Provide Billed Spend, Reliable Per-Request Pricing,
					Or A Complete LLM Failure Rate. A Dash Means Unavailable.
					Engine Filters Apply To All Engine Types In Activity Logs
					And To The Corresponding Model In Inference Logs.
				</Muted>
			</section>
		</div>
	);
}
