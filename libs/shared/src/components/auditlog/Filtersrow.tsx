/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */

import { CheckCircle, Clock, Filter, Hash, XCircle } from "lucide-react";
import { useEffect } from "react";
import {
	ScrollArea,
	ScrollBar,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import DateRangeFilter from "./DateRangeFilter";

export const ENGINE_TYPES = [
	"APP",
	"MODEL",
	"DATABASE",
	"VECTOR",
	"FUNCTION",
	"STORAGE",
	"PROJECT",
];

export type EngineOption = { value: string; label: string };

export interface FiltersRowProps {
	totalCount: number;
	successPct: number;
	failCount: number;
	avgLat: string;

	engineType: string;
	engineId: string;
	engineNames: EngineOption[];
	hasFilters: boolean;

	dateFrom: string;
	dateTo: string;

	onEngineTypeChange: (type: string) => void;
	onEngineChange: (id: string) => void;
	onDateChange: (from: string, to: string, preset?: string) => void;
}

export const FiltersRow = ({
	totalCount,
	successPct,
	failCount,
	avgLat,
	engineType,
	engineId,
	engineNames,
	dateFrom,
	dateTo,
	onEngineTypeChange,
	onEngineChange,
	onDateChange,
}: FiltersRowProps) => {
	const statCards = [
		{
			label: "Total",
			value: String(totalCount),
			icon: Hash,
			accent: undefined as string | undefined,
		},
		{
			label: "Success",
			value: `${successPct}%`,
			icon: CheckCircle,
			accent: "text-success",
		},
		{
			label: "Failed",
			value: String(failCount),
			icon: XCircle,
			accent: failCount > 0 ? "text-destructive" : undefined,
		},
		{
			label: "Avg Latency",
			value: `${avgLat}ms`,
			icon: Clock,
			accent: "text-primary",
		},
	];
	useEffect(() => {
		if (!engineType) {
			onEngineTypeChange("APP");
		}
	}, [engineType, onEngineTypeChange]);

	useEffect(() => {
		if (engineType && !engineId && engineNames.length > 0) {
			onEngineChange(engineNames[0].value);
		}
	}, [engineType, engineNames, engineId, onEngineChange]);

	return (
		<ScrollArea className="w-full">
			<div className="flex flex-shrink-0 items-stretch gap-2">
				{/* ── Stat Cards ── */}
				<div className="flex flex-1 gap-2">
					{statCards.map((s) => (
						<div
							key={s.label}
							className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-1.5"
						>
							<div className="flex items-center gap-1.5">
								<s.icon
									size={10}
									className="flex-shrink-0 text-muted-foreground"
								/>
								<span className="truncate text-[9px] text-muted-foreground uppercase tracking-widest">
									{s.label}
								</span>
							</div>
							<p
								className={`font-semibold text-lg leading-tight ${
									s.accent ?? "text-foreground"
								}`}
							>
								{s.value}
							</p>
						</div>
					))}
				</div>

				{/* ── Filters ── */}
				<div className="flex flex-shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3">
					<Filter size={11} className="text-muted-foreground" />

					{/* ── Engine Type ── */}
					<span className="text-[9px] text-muted-foreground uppercase tracking-widest">
						Catalogue
					</span>

					<Select
						value={engineType || "APP"}
						onValueChange={onEngineTypeChange}
					>
						<SelectTrigger className="h-7 w-[110px] border-0 bg-transparent px-1 text-xs shadow-none">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							{ENGINE_TYPES.map((t) => (
								<SelectItem key={t} value={t}>
									{t}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<div className="h-4 w-px bg-border" />

					{/* ── Engine Name ── */}
					<span className="text-[9px] text-muted-foreground uppercase tracking-widest">
						Name
					</span>

					<Select
						value={engineId || engineNames?.[0]?.value}
						onValueChange={onEngineChange}
						disabled={!engineType}
					>
						<SelectTrigger className="h-7 w-[160px] border-0 bg-transparent px-1 text-xs shadow-none">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							{engineNames.map((n) => (
								<SelectItem key={n.value} value={n.value}>
									{n.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="h-4 w-px bg-border" />
					<span className="text-[9px] text-muted-foreground uppercase tracking-widest">
						User
					</span>

					<Select
						value={engineId || engineNames?.[0]?.value}
						onValueChange={onEngineChange}
						disabled={!engineType}
					>
						<SelectTrigger className="h-7 w-[160px] border-0 bg-transparent px-1 text-xs shadow-none">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							{engineNames.map((n) => (
								<SelectItem key={n.value} value={n.value}>
									{n.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="h-4 w-px bg-border" />

					{/* ── Date Range ── */}
					<DateRangeFilter
						dateFrom={dateFrom}
						dateTo={dateTo}
						onChange={onDateChange}
					/>
				</div>
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	);
};

export default FiltersRow;
