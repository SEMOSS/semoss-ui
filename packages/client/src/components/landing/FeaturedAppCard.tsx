import { ArrowRight as ArrowForwardIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Badge, Button } from "@semoss/ui/next";

interface FeaturedAppCardProps {
	/**
	 * Where to navigate
	 */
	href?: string | undefined;
	/**
	 * Tagline
	 */
	tagline: string;

	/**
	 * the chip to display
	 */
	chip: {
		label: string;
		color: string;
	};

	/**
	 * description
	 */
	description: string;

	/**
	 * image
	 */
	imageUrl: string;
}

export const FeaturedAppCard = observer((props: FeaturedAppCardProps) => {
	const { tagline, imageUrl, description, chip, href } = props;
	return (
		<div className="flex rounded-xl border border-border bg-card shadow-sm">
			<div className="flex w-full flex-col items-start justify-between p-4">
				<div className="flex w-full justify-between">
					<p className="font-medium text-base">{tagline}</p>
					<Badge
						variant="secondary"
						className="rounded"
						style={{
							backgroundColor: `color-mix(in srgb, ${chip.color} 14%, var(--background))`,
							color: chip.color,
						}}
					>
						{chip.label}
					</Badge>
				</div>
				<div className="flex w-full justify-between py-4">
					<p className="text-muted-foreground text-sm">
						{description}
					</p>
				</div>
				<div className="flex w-full justify-start">
					{!href ? (
						<Button variant="ghost" disabled={true}>
							Try it out
							<ArrowForwardIcon className="size-4" />
						</Button>
					) : (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-inherit no-underline"
						>
							<Button variant="ghost">
								Try it out
								<ArrowForwardIcon className="size-4" />
							</Button>
						</a>
					)}
				</div>
			</div>
			<div
				className="min-w-[204px] rounded-xl bg-no-repeat"
				style={{
					backgroundImage: `url(${imageUrl})`,
					backgroundSize: "100% 100%",
				}}
			>
				&nbsp;
			</div>
		</div>
	);
});
