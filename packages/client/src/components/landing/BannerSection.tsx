import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
	const navigate = useNavigate();

	return (
		<div
			className="flex w-full flex-col items-start rounded-[24px] px-[21px] py-[53px]"
			style={{
				minHeight: "276px",
				background: `linear-gradient(270deg, transparent 19.7%, color-mix(in srgb, var(--background) 30%, transparent) 81.54%, color-mix(in srgb, var(--primary) 20%, transparent) 106.35%), url(${imageUrl}) no-repeat center / cover`,
			}}
		>
			<H3 className="font-bold text-foreground">{tagline}</H3>
			<P className="w-1/2 py-6 font-medium text-foreground tracking-[0.15px]">
				{description}
			</P>
			<Button
				size="lg"
				className="mt-auto rounded-[12px]"
				onClick={() => navigate(link.to)}
			>
				{link.label}
				<ArrowRight />
			</Button>
		</div>
	);
};
