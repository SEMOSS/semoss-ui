/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@semoss/ui/next";

type Preset = "today" | "7days" | "30days" | "custom";

interface DateRangeFilterProps {
	dateFrom: string;
	dateTo: string;
	onChange: (from: string, to: string, preset?: string) => void;
	activePreset?: Preset;
}

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const PRESETS: [Preset, string][] = [
	["today", "Today"],
	["7days", "Last 7 Days"],
	["30days", "Last 30 Days"],
	["custom", "Custom Range"],
];

const DateRangeFilter = ({
	dateFrom,
	dateTo,
	onChange,
	activePreset,
}: DateRangeFilterProps) => {
	const [preset, setPreset] = useState<Preset>(activePreset ?? "today");
	const [showCalendar, setShowCalendar] = useState(false);
	const [calMonth, setCalMonth] = useState(new Date().getMonth());
	const [calYear, setCalYear] = useState(new Date().getFullYear());
	const [customFrom, setCustomFrom] = useState(dateFrom);
	const [customTo, setCustomTo] = useState(dateTo);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	// Sync internal preset when parent changes it (e.g. on refresh)
	useEffect(() => {
		if (activePreset !== undefined) {
			setPreset(activePreset);
		}
	}, [activePreset]);

	const today = new Date();
	const fmt = (d: Date) => d.toISOString().split("T")[0];

	const applyPreset = (p: Preset) => {
		setPreset(p);
		if (p === "custom") {
			setCustomFrom("");
			setCustomTo("");
			setDropdownOpen(false);
			setTimeout(() => setShowCalendar(true), 0);
			return;
		}
		setCustomFrom("");
		setCustomTo("");
		const t = fmt(today);
		if (p === "today") {
			onChange(t, t, p);
		} else if (p === "7days") {
			const d = new Date(today);
			d.setDate(d.getDate() - 7);
			onChange(fmt(d), t, p);
		} else if (p === "30days") {
			const d = new Date(today);
			d.setDate(d.getDate() - 30);
			onChange(fmt(d), t, p);
		}
	};

	const presetLabel = PRESETS.find(([id]) => id === preset)?.[1] ?? "Today";

	const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
	const firstDay = new Date(calYear, calMonth, 1).getDay();
	const calDays: (number | null)[] = [];
	for (let i = 0; i < firstDay; i++) calDays.push(null);
	for (let i = 1; i <= daysInMonth; i++) calDays.push(i);

	const isToday = (day: number) =>
		day === today.getDate() &&
		calMonth === today.getMonth() &&
		calYear === today.getFullYear();

	const dayStr = (day: number) =>
		`${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

	const handleDayClick = (day: number) => {
		const d = dayStr(day);
		if (!customFrom || (customFrom && customTo)) {
			setCustomFrom(d);
			setCustomTo("");
		} else {
			if (d < customFrom) {
				setCustomTo(customFrom);
				setCustomFrom(d);
			} else {
				setCustomTo(d);
			}
		}
	};

	const isInRange = (day: number) => {
		if (!customFrom || !customTo) return false;
		const d = dayStr(day);
		return d >= customFrom && d <= customTo;
	};

	const isSelected = (day: number) => {
		const d = dayStr(day);
		return d === customFrom || d === customTo;
	};

	const isPastDate = (day: number) =>
		new Date(calYear, calMonth, day) > today;

	const applyCustom = () => {
		if (customFrom) {
			onChange(customFrom, customTo || customFrom, "custom");
			setShowCalendar(false);
		}
	};

	const prevMonth = () => {
		if (calMonth === 0) {
			setCalMonth(11);
			setCalYear((y) => y - 1);
		} else setCalMonth((m) => m - 1);
	};
	const nextMonth = () => {
		if (calMonth === 11) {
			setCalMonth(0);
			setCalYear((y) => y + 1);
		} else setCalMonth((m) => m + 1);
	};

	return (
		<div className="relative min-w-0 flex-1 p-2">
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
							<Button className="flex w-full items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-left transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
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
						{PRESETS.map(([id, label]) => (
							<>
								{/* Separator before Custom */}
								{id === "custom" && (
									<DropdownMenuSeparator key="sep" />
								)}
								<DropdownMenuItem
									key={id}
									onSelect={() => applyPreset(id)}
									className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition-colors focus:bg-secondary ${
										preset === id
											? "font-medium text-primary"
											: "text-foreground"
									}`}
								>
									{/* Checkmark for active preset */}
									<span className="w-3 text-primary">
										{preset === id ? "✓" : ""}
									</span>
									{label}
								</DropdownMenuItem>
							</>
						))}
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
					onEscapeKeyDown={() => setShowCalendar(false)}
				>
					{/* Date inputs */}
					<div className="mb-3 flex gap-2">
						<input
							type="text"
							value={customFrom}
							readOnly
							placeholder="Start date"
							className="flex-1 rounded border border-border bg-secondary px-2 py-1 font-mono text-foreground text-xs outline-none"
						/>
						<input
							type="text"
							value={customTo}
							readOnly
							placeholder="End date"
							className="flex-1 rounded border border-border bg-secondary px-2 py-1 font-mono text-foreground text-xs outline-none"
						/>
					</div>

					{/* Month/Year navigation */}
					<div className="mb-2 flex items-center justify-between">
						<Button
							onClick={prevMonth}
							variant="ghost"
							className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
						>
							<ChevronLeft size={14} />
						</Button>
						<span className="font-medium text-foreground text-xs">
							{MONTHS[calMonth]} {calYear}
						</span>
						<Button
							onClick={nextMonth}
							variant="ghost"
							className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
						>
							<ChevronRight size={14} />
						</Button>
					</div>

					{/* Day headers */}
					<div className="mb-1 grid grid-cols-7">
						{DAYS.map((d) => (
							<div
								key={d}
								className="py-1 text-center font-medium text-[10px] text-muted-foreground"
							>
								{d}
							</div>
						))}
					</div>

					{/* Days grid */}
					<div className="grid grid-cols-7">
						{calDays.map((day, i) => (
							<div
								key={i}
								className="flex items-center justify-center"
							>
								{day ? (
									<Button
										onClick={() =>
											!isPastDate(day) &&
											handleDayClick(day)
										}
										variant="ghost"
										disabled={isPastDate(day)}
										className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all hover:bg-transparent ${
											isSelected(day)
												? "bg-primary font-semibold text-primary-foreground hover:bg-primary hover:text-(--background)"
												: isInRange(day)
													? "bg-primary/20 text-primary"
													: isToday(day)
														? "border border-primary font-medium text-primary"
														: isPastDate(day)
															? "cursor-not-allowed text-muted-foreground/40"
															: "text-foreground hover:bg-secondary"
										}`}
									>
										{day}
									</Button>
								) : (
									<div className="h-8 w-8" />
								)}
							</div>
						))}
					</div>

					{/* Calendar actions */}
					<div className="mt-3 flex items-center justify-between border-border border-t pt-2">
						<Button
							onClick={() => {
								setCustomFrom("");
								setCustomTo("");
								setShowCalendar(false);
							}}
							variant="ghost"
							className="rounded border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
						>
							Cancel
						</Button>
						<Button
							onClick={applyCustom}
							variant="ghost"
							className="rounded bg-primary px-4 py-1.5 font-medium text-primary-foreground text-xs transition-colors hover:bg-primary/90 hover:text-(--background)"
						>
							Apply
						</Button>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
};

export default DateRangeFilter;
