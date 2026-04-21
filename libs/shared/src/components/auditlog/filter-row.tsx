import {
	Activity,
	CheckCircle,
	ChevronDown,
	Clock,
	RefreshCw,
	ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	Calendar,
	type DateRange,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Popover,
	PopoverAnchor,
	PopoverContent,
	ScrollArea,
	ScrollBar,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

type DateRangePreset = "today" | "7days" | "30days" | "custom";

const PRESET_LABELS: Record<DateRangePreset, string> = {
	today: "Today",
	"7days": "Last 7 Days",
	"30days": "Last 30 Days",
	custom: "Custom Range",
};

const formatDate = (d: Date): string => {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const parseDate = (s: string): Date | undefined => {
	if (!s) return undefined;
	const parts = s.split("-").map(Number);
	return new Date(parts[0], parts[1] - 1, parts[2]);
};

export const ENGINE_TYPES = [
	"APP",
	"MODEL",
	"DATABASE",
	"VECTOR",
	"FUNCTION",
	"STORAGE",
	"GUARDRAIL",
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
	showUserFilter?: boolean;
	showEngineFilter?: boolean;

	onEngineTypeChange: (type: string) => void;
	onEngineChange: (id: string) => void;
	onDateChange: (from: string, to: string, preset?: string) => void;
	onUserChange: (userId: string) => void;
	onRefresh?: () => void;
}

export const FilterRow = ({
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
	showUserFilter = false,
	showEngineFilter = true,
	onEngineTypeChange,
	onEngineChange,
	onDateChange,
	onUserChange,
	onRefresh,
}: FiltersRowProps) => {
	const [preset, setPreset] = useState<DateRangePreset>(
		(dateRangePreset as DateRangePreset) ?? "today",
	);
	const [showCalendar, setShowCalendar] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [range, setRange] = useState<DateRange>(() => {
		const from = parseDate(dateFrom);
		const to = parseDate(dateTo);
		return { from: from ?? new Date(), to: to ?? new Date() };
	});

	const today = new Date();

	const rangeFromProps = (): DateRange => {
		const from = parseDate(dateFrom);
		const to = parseDate(dateTo);
		return { from: from ?? new Date(), to: to ?? new Date() };
	};

	const applyPreset = (p: DateRangePreset) => {
		setPreset(p);
		if (p === "custom") {
			setRange(rangeFromProps());
			setDropdownOpen(false);
			setTimeout(() => setShowCalendar(true), 0);
			return;
		}
		setRange({ from: today, to: today });
		const t = formatDate(today);
		if (p === "today") {
			onDateChange(t, t, p);
		} else if (p === "7days") {
			const d = new Date(today);
			d.setDate(d.getDate() - 7);
			onDateChange(formatDate(d), t, p);
		} else if (p === "30days") {
			const d = new Date(today);
			d.setDate(d.getDate() - 30);
			onDateChange(formatDate(d), t, p);
		}
	};

	const applyCustomRange = () => {
		if (range.from) {
			const from = formatDate(range.from);
			const to = range.to ? formatDate(range.to) : from;
			onDateChange(from, to, "custom");
			setShowCalendar(false);
		}
	};

	const presetLabel = PRESET_LABELS[preset] ?? "Today";
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

	useEffect(() => {
		if (dateRangePreset !== undefined) {
			setPreset(dateRangePreset as DateRangePreset);
		}
	}, [dateRangePreset]);

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
						{showEngineFilter && (
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
						)}

						{/* ── Engine Name ── */}
						{showEngineFilter && (
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
										<SelectItem
											key={n.value}
											value={n.value}
										>
											{n.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{/* ── User ── */}
						{showUserFilter && (
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
										<SelectItem
											key={u.value}
											value={u.value}
										>
											{u.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{/* ── Date Range ── */}
						<Popover open={showCalendar}>
							<DropdownMenu
								open={dropdownOpen}
								onOpenChange={(open) => {
									setDropdownOpen(open);
									setShowCalendar(false);
								}}
							>
								<PopoverAnchor asChild>
									<DropdownMenuTrigger asChild>
										<Button className="flex h-8 w-[140px] items-center gap-1 rounded-md border border-border bg-card px-3 text-left transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
											<span className="flex-1 text-foreground text-xs leading-tight">
												{presetLabel}
											</span>
											<ChevronDown
												size={14}
												className={`text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
											/>
										</Button>
									</DropdownMenuTrigger>
								</PopoverAnchor>

								<DropdownMenuContent
									align="start"
									className="w-48 rounded-lg border border-border bg-card shadow-xl"
								>
									{(
										[
											"today",
											"7days",
											"30days",
										] as DateRangePreset[]
									).map((id) => (
										<DropdownMenuItem
											key={id}
											onSelect={() => applyPreset(id)}
											className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition-colors focus:bg-secondary ${
												preset === id
													? "font-medium text-primary"
													: "text-foreground"
											}`}
										>
											<span className="w-3 text-primary">
												{preset === id ? "\u2713" : ""}
											</span>
											{PRESET_LABELS[id]}
										</DropdownMenuItem>
									))}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onSelect={() => applyPreset("custom")}
										className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition-colors focus:bg-secondary ${
											preset === "custom"
												? "font-medium text-primary"
												: "text-foreground"
										}`}
									>
										<span className="w-3 text-primary">
											{preset === "custom"
												? "\u2713"
												: ""}
										</span>
										Custom Range
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<PopoverContent
								align="end"
								sideOffset={4}
								className="w-fit rounded-lg border border-border bg-card p-3 shadow-xl"
								onOpenAutoFocus={(e) => e.preventDefault()}
								onCloseAutoFocus={(e) => e.preventDefault()}
								onInteractOutside={(e) => e.preventDefault()}
								onFocusOutside={(e) => e.preventDefault()}
								onEscapeKeyDown={() => {
									setShowCalendar(false);
								}}
							>
								{/* Selected date display */}
								<div className="mb-3 flex gap-2">
									<input
										type="text"
										value={
											range.from
												? formatDate(range.from)
												: ""
										}
										readOnly
										placeholder="Start date"
										className="flex-1 rounded border border-border bg-secondary px-2 py-1 font-mono text-foreground text-xs outline-none"
									/>
									<input
										type="text"
										value={
											range.to ? formatDate(range.to) : ""
										}
										readOnly
										placeholder="End date"
										className="flex-1 rounded border border-border bg-secondary px-2 py-1 font-mono text-foreground text-xs outline-none"
									/>
								</div>

								<Calendar
									mode="range"
									className="w-full"
									selected={range}
									onSelect={(newRange) =>
										setRange(
											newRange ?? {
												from: today,
												to: today,
											},
										)
									}
									disabled={{ after: today }}
									defaultMonth={range.from ?? today}
								/>

								{/* Actions */}
								<div className="mt-3 flex items-center justify-between border-border border-t pt-2">
									<Button
										onClick={() => {
											setRange(rangeFromProps());
											setShowCalendar(false);
											if (
												dateRangePreset &&
												dateRangePreset !== "custom"
											) {
												setPreset(
													dateRangePreset as DateRangePreset,
												);
											}
										}}
										variant="ghost"
										className="rounded border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
									>
										Cancel
									</Button>
									<Button
										onClick={applyCustomRange}
										disabled={!range.from}
										variant="ghost"
										className="rounded bg-primary px-4 py-1.5 font-medium text-primary-foreground text-xs transition-colors hover:bg-primary/90 hover:text-(--background)"
									>
										Apply
									</Button>
								</div>
							</PopoverContent>
						</Popover>

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

export default FilterRow;
