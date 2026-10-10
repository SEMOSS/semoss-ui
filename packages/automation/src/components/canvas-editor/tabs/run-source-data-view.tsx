import { Braces, Database, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CellOutputBlock } from "@semoss/shared";
import { Input } from "@semoss/ui/next";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
} from "../../../domain/automation.types";
import { StatusBadge } from "../../status-badge";
import { RunNodeDataViewer } from "./run-node-data-viewer";

interface RunSourceDataViewProps {
	appId: string;
	run: AutomationRunDetail;
	onOutputPopout: (output: string) => void;
}

interface SourceRecord {
	key: string;
	kind: "input" | "output";
	name: string;
	label: string;
	status?: AutomationNodeResult["STATUS"];
	iteration?: number;
	result?: AutomationNodeResult;
	value: string;
}

/** Searchable run inputs and node variables, backed by retained output pages. */
export function RunSourceDataView({
	appId,
	run,
	onOutputPopout,
}: RunSourceDataViewProps) {
	const [query, setQuery] = useState("");
	const records = useMemo(() => buildRecords(run), [run]);
	const filtered = useMemo(() => {
		const normalized = query.trim().toLocaleLowerCase();
		if (!normalized) return records;
		return records.filter((record) =>
			[
				record.name,
				record.label,
				record.status,
				record.value,
				record.iteration == null
					? ""
					: `iteration ${record.iteration + 1}`,
			]
				.join(" ")
				.toLocaleLowerCase()
				.includes(normalized),
		);
	}, [query, records]);
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const selected =
		filtered.find((record) => record.key === selectedKey) ??
		filtered[0] ??
		null;

	return (
		<div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
			<div className="flex w-64 shrink-0 flex-col border-r bg-muted/20 p-2">
				<div className="relative mb-2">
					<Search
						className="-translate-y-1/2 absolute top-1/2 left-2 size-3.5 text-muted-foreground"
						aria-hidden
					/>
					<Input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search variables or values"
						className="h-8 pl-7 text-xs"
						aria-label="Search source data"
					/>
				</div>
				<div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
					{filtered.length === 0 ? (
						<p className="px-2 py-4 text-center text-muted-foreground text-xs">
							No source variables match this search.
						</p>
					) : (
						filtered.map((record) => {
							const active = record.key === selected?.key;
							const Icon =
								record.kind === "input" ? Braces : Database;
							return (
								<button
									key={record.key}
									type="button"
									onClick={() => setSelectedKey(record.key)}
									className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left ${active ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
								>
									<Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
									<span className="min-w-0 flex-1">
										<span className="block truncate font-medium text-xs">
											{record.name}
										</span>
										<span className="block truncate text-muted-foreground text-xs">
											{record.label}
											{record.iteration == null
												? ""
												: ` · Iteration ${record.iteration + 1}`}
										</span>
									</span>
									{record.status && (
										<StatusBadge status={record.status} />
									)}
								</button>
							);
						})
					)}
				</div>
			</div>
			<section className="min-w-0 flex-1 overflow-y-auto p-3">
				{!selected ? (
					<div className="flex h-full items-center justify-center text-muted-foreground text-xs">
						Select a source variable to inspect it.
					</div>
				) : (
					<div className="space-y-3">
						<div>
							<p className="font-medium text-sm">
								{selected.name}
							</p>
							<p className="text-muted-foreground text-xs">
								{selected.kind === "input"
									? "Trigger input"
									: selected.label}
							</p>
						</div>
						{selected.result?.outputDataAvailable ? (
							<RunNodeDataViewer
								appId={appId}
								runId={run.RUN_ID}
								nodeId={
									selected.result.trace?.nodeId ??
									selected.result.NODE_ID
								}
								outputPreview={selected.value}
								onOutputPopout={onOutputPopout}
							/>
						) : (
							<CellOutputBlock
								output={
									selected.value || "No value was retained."
								}
								onOutputPopout={() =>
									onOutputPopout(
										selected.value ||
											"No value was retained.",
									)
								}
							/>
						)}
					</div>
				)}
			</section>
		</div>
	);
}

function buildRecords(run: AutomationRunDetail): SourceRecord[] {
	const records: SourceRecord[] = [];
	if (run.INPUT_SNAPSHOT) {
		try {
			const input = JSON.parse(run.INPUT_SNAPSHOT) as unknown;
			if (input && typeof input === "object" && !Array.isArray(input)) {
				for (const [name, value] of Object.entries(input)) {
					records.push({
						key: `input:${name}`,
						kind: "input",
						name,
						label: "Trigger input",
						value: formatValue(value),
					});
				}
			} else {
				records.push({
					key: "input:payload",
					kind: "input",
					name: "Input payload",
					label: "Trigger input",
					value: formatValue(input),
				});
			}
		} catch {
			records.push({
				key: "input:payload",
				kind: "input",
				name: "Input payload",
				label: "Trigger input",
				value: run.INPUT_SNAPSHOT,
			});
		}
	}

	for (const result of run.nodeResults ?? []) {
		appendResult(records, result);
		for (const iteration of result.iterations ?? []) {
			for (const child of iteration.nodeResults) {
				appendResult(records, child, iteration.index);
			}
		}
	}
	return records;
}

function appendResult(
	records: SourceRecord[],
	result: AutomationNodeResult,
	iteration?: number,
) {
	if (
		!result.outputVariable &&
		!result.OUTPUT_PREVIEW &&
		!result.ERROR_MESSAGE
	)
		return;
	const runtimeNodeId = result.trace?.nodeId ?? result.NODE_ID;
	records.push({
		key: `output:${runtimeNodeId}:${iteration ?? "root"}`,
		kind: "output",
		name: result.outputVariable || result.NODE_LABEL || result.NODE_ID,
		label: result.NODE_LABEL || result.NODE_ID,
		status: result.STATUS,
		iteration,
		result,
		value:
			result.OUTPUT_PREVIEW ??
			result.ERROR_MESSAGE ??
			"No value was retained.",
	});
}

function formatValue(value: unknown): string {
	if (typeof value === "string") return value;
	return JSON.stringify(value, null, 2);
}
