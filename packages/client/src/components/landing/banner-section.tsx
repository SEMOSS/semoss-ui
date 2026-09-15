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

	/**
	 * image to use in dark mode
	 */
	darkImageUrl?: string;
}

export const BannerSection = (props: BannerSectionProps) => {
	const { tagline, imageUrl, darkImageUrl, description, link } = props;

	return (
		<div className="relative flex min-h-[180px] w-full flex-col items-start overflow-hidden rounded-[24px] bg-card px-5 py-8 md:min-h-[272px] md:px-6 md:py-14">
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-cover bg-right dark:hidden"
				style={{
					backgroundImage: `url(${imageUrl})`,
				}}
			/>
			{darkImageUrl ? (
				<div
					aria-hidden="true"
					className="absolute inset-0 hidden bg-cover bg-right dark:block"
					style={{
						backgroundImage: `url(${darkImageUrl})`,
					}}
				/>
			) : null}
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/10"
			/>
			<div className="relative z-10 flex h-full max-w-[780px] flex-1 flex-col items-start">
				<H3 className="font-bold text-foreground leading-[133.4%]">
					{tagline}
				</H3>
				<P className="w-full py-4 font-normal font-sans text-base text-muted-foreground leading-normal tracking-normal md:py-6">
					{description}
				</P>
				<Button
					asChild
					variant="default"
					size="lg"
					className="mt-auto rounded-md"
				>
					<a href={link.to} target="_blank" rel="noopener noreferrer">
						{link.label}
					</a>
				</Button>
			</div>
		</div>
	);
};
