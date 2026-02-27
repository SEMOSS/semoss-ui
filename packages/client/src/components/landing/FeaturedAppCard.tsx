import { ArrowRight } from "lucide-react";
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
		<div className="flex rounded-xl bg-card shadow-sm">
			<div className="flex w-full flex-col items-center justify-between p-4">
				{/* Title row */}
				<div className="flex w-full justify-between">
					<p className="font-medium text-base text-foreground leading-[150%] tracking-[0.15px]">
						{tagline}
					</p>
					<Badge
						variant="secondary"
						className="rounded-sm font-normal text-xs"
						style={{ color: chip.color }}
					>
						{chip.label}
					</Badge>
				</div>

				{/* Description row */}
				<div className="flex w-full justify-between py-4">
					<p className="text-foreground text-sm">{description}</p>
				</div>

				{/* Button row */}
				<div className="flex w-full justify-start">
					{!href ? (
						<Button
							variant="ghost"
							size="sm"
							disabled
							className="px-0"
						>
							Try it out
							<ArrowRight className="text-muted-foreground" />
						</Button>
					) : (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="no-underline"
						>
							<Button variant="ghost" size="sm" className="px-0">
								Try it out
								<ArrowRight className="text-primary" />
							</Button>
						</a>
					)}
				</div>
			</div>

			{/* Image section */}
			<div
				className="flex min-w-[204px] rounded-xl"
				style={{
					backgroundImage: `url(${imageUrl})`,
					backgroundSize: "100% 100%",
					backgroundRepeat: "no-repeat",
				}}
			>
				&nbsp;
			</div>
		</div>
	);
});
