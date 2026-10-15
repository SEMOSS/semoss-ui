import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, Button, cn, Spinner } from "@semoss/ui/next";

// Shared pieces for the onboarding steps.

export const message = (cause: unknown) =>
	cause instanceof Error ? cause.message : String(cause);

export const formatCount = (value: unknown) =>
	Number(value ?? 0).toLocaleString();

/** Step title block: eyebrow, headline, one line of context. */
export function StepHeader({
	eyebrow,
	title,
	children,
	aside,
}: {
	eyebrow: string;
	title: string;
	children?: ReactNode;
	aside?: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div className="max-w-2xl space-y-1.5">
				<p className="font-medium text-primary text-xs uppercase tracking-widest">
					{eyebrow}
				</p>
				<h1 className="font-semibold text-xl tracking-tight md:text-2xl">
					{title}
				</h1>
				{children && (
					<p className="text-muted-foreground text-sm leading-relaxed">
						{children}
					</p>
				)}
			</div>
			{aside && <div className="shrink-0">{aside}</div>}
		</div>
	);
}

/** Bottom action bar of a step. */
export function StepActions({
	onBack,
	children,
	note,
}: {
	onBack?: () => void;
	children: ReactNode;
	note?: ReactNode;
}) {
	return (
		<div className="-mx-4 sm:-mx-6 -mb-4 sm:-mb-6 sticky bottom-0 z-10 mt-2 flex flex-wrap items-center gap-3 rounded-b-xl border-t bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
			{onBack && (
				<Button type="button" variant="ghost" onClick={onBack}>
					Back
				</Button>
			)}
			{note && (
				<div className="text-muted-foreground text-sm">{note}</div>
			)}
			<div className="ml-auto flex flex-wrap gap-2">{children}</div>
		</div>
	);
}

export function StatTile({
	label,
	value,
	hint,
	tone = "default",
	icon,
}: {
	label: string;
	value: ReactNode;
	hint?: ReactNode;
	tone?: "default" | "primary" | "teal" | "amber" | "slate" | "muted";
	icon?: ReactNode;
}) {
	const tones = {
		default: "bg-card",
		primary: "bg-primary/[0.07] ring-primary/20",
		teal: "bg-chart-2/[0.08] ring-chart-2/20",
		amber: "bg-chart-4/[0.1] ring-chart-4/25",
		slate: "bg-chart-3/[0.06] ring-chart-3/20",
		muted: "bg-muted/60",
	};
	return (
		<div
			className={cn(
				"rounded-2xl p-4 ring-1 ring-border/60 transition-colors",
				tones[tone],
			)}
		>
			<div className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
				<span>{label}</span>
				{icon}
			</div>
			<div className="mt-2 font-semibold text-3xl tabular-nums tracking-tight">
				{value}
			</div>
			{hint && (
				<div className="mt-1 text-muted-foreground text-xs">{hint}</div>
			)}
		</div>
	);
}

/** A card that toggles on click; selected cards carry a check and a primary ring. */
export function SelectCard({
	selected,
	onToggle,
	disabled,
	children,
	className,
	label,
}: {
	selected: boolean;
	onToggle: () => void;
	disabled?: boolean;
	children: ReactNode;
	className?: string;
	label: string;
}) {
	return (
		<button
			type="button"
			aria-pressed={selected}
			aria-label={label}
			disabled={disabled}
			onClick={onToggle}
			className={cn(
				"group relative flex w-full items-start gap-3 rounded-2xl bg-card p-3.5 text-left ring-1 ring-border/70 transition-all",
				"hover:-translate-y-0.5 hover:shadow-md hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
				selected && "bg-primary/[0.03] ring-primary/45",
				disabled &&
					"cursor-default opacity-70 hover:translate-y-0 hover:shadow-none",
				className,
			)}
		>
			{children}
			<span
				aria-hidden="true"
				className={cn(
					"ml-auto flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
					selected
						? "border-primary bg-primary text-primary-foreground"
						: "border-border bg-background text-transparent group-hover:border-primary/50",
				)}
			>
				<Check className="size-3" strokeWidth={3} />
			</span>
		</button>
	);
}

/** Circular progress with the percentage in the middle. */
export function ProgressRing({
	value,
	size = 148,
	children,
}: {
	value: number;
	size?: number;
	children?: ReactNode;
}) {
	const stroke = 10;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const clamped = Math.max(0, Math.min(100, value));
	return (
		<div className="relative" style={{ width: size, height: size }}>
			<svg
				width={size}
				height={size}
				className="-rotate-90"
				aria-hidden="true"
			>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					strokeWidth={stroke}
					className="stroke-primary/15"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - clamped / 100)}
					className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="font-semibold text-3xl tabular-nums tracking-tight">
					{Math.round(clamped)}%
				</span>
				{children}
			</div>
		</div>
	);
}

/** A checklist row for a background job phase. */
export function PhaseRow({
	state,
	children,
}: {
	state: "done" | "active" | "todo";
	children: ReactNode;
}) {
	return (
		<li className="flex items-center gap-3 text-sm">
			<span
				className={cn(
					"flex size-6 shrink-0 items-center justify-center rounded-full",
					state === "done" && "bg-primary text-primary-foreground",
					state === "active" && "bg-primary/10 text-primary",
					state === "todo" && "bg-muted text-muted-foreground",
				)}
			>
				{state === "done" ? (
					<Check className="size-3.5" strokeWidth={3} />
				) : state === "active" ? (
					<Spinner className="size-3.5" />
				) : (
					<span className="size-1.5 rounded-full bg-current" />
				)}
			</span>
			<span
				className={cn(
					state === "todo" && "text-muted-foreground",
					state === "active" && "font-medium",
				)}
			>
				{children}
			</span>
		</li>
	);
}

export function Failure({
	error,
	onRetry,
}: {
	error: string;
	onRetry?: () => void;
}) {
	return (
		<Alert variant="destructive">
			<AlertDescription className="flex items-center justify-between gap-2">
				<span>{error}</span>
				{onRetry && (
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={onRetry}
					>
						Retry
					</Button>
				)}
			</AlertDescription>
		</Alert>
	);
}

/** Placeholder blocks while a step loads. */
export function LoadingCards({
	label,
	count = 3,
}: {
	label: string;
	count?: number;
}) {
	return (
		<div className="space-y-3" aria-busy="true">
			<div className="flex items-center gap-2 text-muted-foreground text-sm">
				<Spinner /> {label}
			</div>
			<div className="grid gap-3 sm:grid-cols-3">
				{Array.from({ length: count }, (_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
						key={i}
						className="h-24 animate-pulse rounded-2xl bg-muted/70"
					/>
				))}
			</div>
		</div>
	);
}

/** Cycles the shared data colors for a stable dot per item. */
export function dotColor(index: number) {
	return [
		"bg-chart-1",
		"bg-chart-2",
		"bg-chart-3",
		"bg-chart-4",
		"bg-chart-5",
	][index % 5];
}
