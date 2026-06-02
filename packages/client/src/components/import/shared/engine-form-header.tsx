import { H4, P } from "@semoss/ui/next";

interface EngineFormHeaderProps {
	/** Prefix for the icon/title/description data-testids (e.g. "database"). */
	testIdPrefix: string;
	/** Optional icon URL shown to the left of the title. */
	icon?: string;
	/** Engine display name. */
	title: string;
	/** Helper text shown below the title. */
	description: string;
}

export const EngineFormHeader = ({
	testIdPrefix,
	icon,
	title,
	description,
}: EngineFormHeaderProps) => (
	<div>
		<div className="mb-2 flex items-center gap-2">
			{icon && (
				<div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
					<img
						src={icon}
						alt={title}
						className="h-full w-full object-cover"
						data-testid={`${testIdPrefix}-form-icon`}
					/>
				</div>
			)}
			<H4 data-testid={`${testIdPrefix}-form-title`}>{title}</H4>
		</div>
		<P
			className="mb-3 text-muted-foreground"
			data-testid={`${testIdPrefix}-form-description`}
		>
			{description}
		</P>
	</div>
);
