import {
	Activity,
	CheckCircle,
	Clock,
	RefreshCw,
	ShieldAlert,
} from "lucide-react";
import { useEffect } from "react";
import {
	Button,
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
	dateRangePreset?: string;

	userOptions: EngineOption[];
	selectedUser: string;

	onEngineTypeChange: (type: string) => void;
	onEngineChange: (id: string) => void;
	onDateChange: (from: string, to: string, preset?: string) => void;
	onUserChange: (userId: string) => void;
	onRefresh?: () => void;
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
	dateRangePreset,
	userOptions,
	selectedUser,
	onEngineTypeChange,
	onEngineChange,
	onDateChange,
	onUserChange,
	onRefresh,
}: FiltersRowProps) => {
	const statCards = [
		{
			label: "Total Requests",
			value: String(totalCount),
			icon: Activity,
			iconColor: "text-primary",
			iconBg: "bg-primary/10",
			accent: "text-foreground",
		},
		{
			label: "Success Rate",
			value: `${successPct}%`,
			icon: CheckCircle,
			iconColor: "text-emerald-600",
			iconBg: "bg-emerald-500/10",
			accent: "text-foreground",
		},
		{
			label: "Error Rate",
			value: String(failCount),
			icon: ShieldAlert,
			iconColor: "text-destructive",
			iconBg: "bg-destructive/10",
			accent: failCount > 0 ? "text-destructive" : "text-foreground",
		},
		{
			label: "Avg Response Time",
			value: `${avgLat}ms`,
			icon: Clock,
			iconColor: "text-primary",
			iconBg: "bg-primary/10",
			accent: "text-foreground",
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
		<div className="mb-2 flex w-full flex-col gap-3">
			{/* ── Header + Filters ── */}
			<div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
				<h2 className="flex-shrink-0 font-semibold text-foreground text-lg">
					Timeline &amp; Logs Dashboard
				</h2>

				<ScrollArea className="w-full lg:w-auto">
					<div className="flex items-center gap-2">
						{/* ── Engine Type ── */}
						<Select
							value={engineType || "APP"}
							onValueChange={onEngineTypeChange}
						>
							<SelectTrigger
								title={engineType || "APP"}
								className="h-8 w-[120px] rounded-md border border-border bg-card text-xs"
							>
								<SelectValue placeholder="Catalogue" />
							</SelectTrigger>
							<SelectContent>
								{ENGINE_TYPES?.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* ── Engine Name ── */}
						<Select
							value={engineId || engineNames?.[0]?.value}
							onValueChange={onEngineChange}
							disabled={!engineType}
						>
							<SelectTrigger
								title={
									engineNames?.find(
										(n) =>
											n.value ===
											(engineId ||
												engineNames?.[0]?.value),
									)?.label ?? "Select"
								}
								className="h-8 w-[160px] truncate rounded-md border border-border bg-card text-xs"
							>
								<SelectValue placeholder="Name" />
							</SelectTrigger>
							<SelectContent>
								{engineNames?.map((n) => (
									<SelectItem key={n.value} value={n.value}>
										{n.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* ── User ── */}
						<Select
							value={selectedUser || "__all__"}
							onValueChange={(val) =>
								onUserChange(val === "__all__" ? "" : val)
							}
						>
							<SelectTrigger className="h-8 w-[140px] rounded-md border border-border bg-card text-xs">
								<SelectValue placeholder="All Users" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">
									All Users
								</SelectItem>
								{userOptions.map((u) => (
									<SelectItem key={u.value} value={u.value}>
										{u.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* ── Date Range ── */}
						<DateRangeFilter
							dateFrom={dateFrom}
							dateTo={dateTo}
							onChange={onDateChange}
							activePreset={
								dateRangePreset as
									| "today"
									| "7days"
									| "30days"
									| "custom"
									| undefined
							}
						/>

						{/* ── Refresh ── */}
						{onRefresh && (
							<Button
								variant="outline"
								onClick={onRefresh}
								className="h-8 w-8 flex-shrink-0 cursor-pointer rounded-md border border-border bg-card p-0"
								title="Reset filters"
							>
								<RefreshCw size={14} />
							</Button>
						)}
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>

			{/* ── Stat Cards ── */}
			<ScrollArea className="w-full">
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{statCards?.map((s) => (
						<div
							key={s.label}
							className="flex min-w-[140px] items-center justify-between rounded-2xl border border-border px-5 py-4"
						>
							<div className="min-w-0">
								<p
									className={`font-bold text-2xl leading-tight ${s.accent}`}
								>
									{s.value}
								</p>
								<span className="text-muted-foreground text-sm">
									{s.label}
								</span>
							</div>
							<div
								className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${s.iconBg}`}
							>
								<s.icon size={20} className={s.iconColor} />
							</div>
						</div>
					))}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
};

export default FiltersRow;
