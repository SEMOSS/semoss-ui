export function EntityDetailRow({
	primary,
	details,
	compact,
}: {
	primary: string;
	details: { label: string; value: string }[];
	compact?: boolean;
}) {
	return (
		<div
			className={
				compact ? "flex flex-col gap-0.5" : "flex flex-col gap-1"
			}
		>
			<span className="font-medium text-sm">{primary}</span>
			<div className="flex flex-wrap gap-x-4 gap-y-0.5">
				{details.map((d) => (
					<span
						key={d.label}
						className="text-muted-foreground text-xs"
					>
						<span className="font-medium">{d.label}:</span>{" "}
						{d.value}
					</span>
				))}
			</div>
		</div>
	);
}
