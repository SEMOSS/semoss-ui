import { Check } from "lucide-react";
import { AppCatalogAvatar } from "@semoss/shared";
import { Card, cn, P } from "@semoss/ui/next";
import { getProjectImageUrl } from "@/api";
import { formatToDataTestId } from "@/utility";

export interface TemplateCardProps extends React.ComponentProps<typeof Card> {
	/** Unique template / project ID; also sources the custom image */
	id?: string;
	/** Display name */
	name: string;
	/** Marks the tile as the caller's current selection */
	isSelected?: boolean;
}

/**
 * Template tile. Deliberately minimal — only the image and name. Everything
 * else about the template is surfaced on hover by the caller.
 */
export const TemplateCard = ({
	name,
	id = "",
	isSelected = false,
	className,
	...cardProps
}: TemplateCardProps) => {
	return (
		<Card
			{...cardProps}
			className={cn(
				"flex h-full flex-col gap-0 overflow-hidden p-0 transition-all",
				isSelected && "ring-2 ring-primary",
				className,
			)}
			data-testid={formatToDataTestId(`TemplateCard-${id}`)}
		>
			{/* Large visual header / cover banner */}
			<div className="relative h-40 w-full overflow-hidden border-b bg-muted">
				{/* The gradient and initials are the fallback layer: the
					image request 404s when the template has no custom one. */}
				<div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-primary/10 via-background to-secondary/30">
					<div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-40 dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
					<AppCatalogAvatar
						name={name}
						className="size-16 rounded-xl text-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
					/>
				</div>
				{id ? (
					<img
						src={getProjectImageUrl(id)}
						alt={name}
						loading="lazy"
						className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						onError={(e) => {
							e.currentTarget.style.display = "none";
						}}
					/>
				) : null}
				{isSelected ? (
					<span className="absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
						<Check aria-hidden="true" className="size-3.5" />
						<span className="sr-only">Selected</span>
					</span>
				) : null}
			</div>

			<div className="p-4">
				<P
					className="line-clamp-1 font-semibold text-base"
					title={name}
				>
					{name}
				</P>
			</div>
		</Card>
	);
};
