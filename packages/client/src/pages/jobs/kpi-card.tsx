import type { ReactNode } from "react";

type Tone = "default" | "success" | "warning" | "destructive";

const toneClasses: Record<Tone, string> = {
	default: "text-foreground",
	success: "text-success",
	warning: "text-yellow-600 dark:text-yellow-400",
	destructive: "text-destructive",
};

export const KpiCard = (props: {
	label: string;
	value: ReactNode;
	sub?: ReactNode;
	tone?: Tone;
	loading?: boolean;
}) => {
	const { label, value, sub, tone = "default", loading } = props;

	return (
		<div className="flex min-w-[160px] flex-1 flex-col gap-1 rounded-md border bg-card p-4">
			<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</span>
			{loading ? (
				<span className="h-7 w-16 animate-pulse rounded bg-muted" />
			) : (
				<span
					className={`font-semibold text-2xl leading-none ${toneClasses[tone]}`}
				>
					{value}
				</span>
			)}
			{sub ? (
				<span className="text-muted-foreground text-xs">{sub}</span>
			) : null}
		</div>
	);
};
