import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, H3, P } from "@semoss/ui/next";

interface BannerSectionProps {
	/**
	 * Tagline
	 */
	tagline: string;

	/**
	 * description
	 */
	description: string;

	/**
	 * meta for the button to navigate and display
	 */
	link: {
		label: string;
		to: string;
	};

	/**
	 * image
	 */
	imageUrl: string;
}

export const BannerSection = (props: BannerSectionProps) => {
	const { tagline, imageUrl, description, link } = props;

	return (
		<div
			className="flex h-[276px] w-full flex-col items-start rounded-[24px] px-[21px] py-[53px]"
			style={{
				background: `linear-gradient(
                    270deg, rgba(255,255,255,0.00) 19.7%,
                    rgba(255,255,255,0.3) 81.54%, rgba(219,214,249,0.6) 106.35%) 100%,
                    url(${imageUrl}) no-repeat`,
				backgroundSize: "cover, cover, cover",
			}}
		>
			<H3 className="font-bold text-foreground leading-[133.4%]">
				{tagline}
			</H3>
			<P className="w-3/4 py-6 font-normal font-sans text-[var(--muted-foreground)] text-base leading-normal tracking-normal">
				{description}
			</P>
			<Button
				asChild
				variant="default"
				size="lg"
				className="mt-auto rounded-xl"
			>
				<Link to={link.to} target="_blank" rel="noopener noreferrer">
					{link.label}
					<ArrowRight className="text-primary-foreground" />
				</Link>
			</Button>
		</div>
	);
};
