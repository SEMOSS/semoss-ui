interface JevStepHeadingProps {
	number: number;
	title: string;
	description: string;
}

/** Labels one stage in the guided JEV authoring flow. */
export function JevStepHeading({
	number,
	title,
	description,
}: JevStepHeadingProps) {
	return (
		<div className="flex items-start gap-3">
			<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
				{number}
			</span>
			<div>
				<p className="font-medium text-sm">{title}</p>
				<p className="text-muted-foreground text-xs">{description}</p>
			</div>
		</div>
	);
}
