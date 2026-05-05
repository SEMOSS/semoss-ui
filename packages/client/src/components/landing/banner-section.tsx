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
		<div className="relative flex min-h-[180px] w-full flex-col items-start overflow-hidden rounded-[24px] bg-[#f3f7ff] px-5 py-8 md:min-h-[272px] md:px-6 md:py-14 dark:bg-[#111827]">
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
				className="absolute inset-0 bg-[linear-gradient(270deg,rgba(255,255,255,0)_19.7%,rgba(255,255,255,0.3)_81.54%,rgba(219,214,249,0.6)_106.35%)] dark:bg-[linear-gradient(90deg,#111827_0%,rgba(17,24,39,0.96)_33%,rgba(17,24,39,0.68)_58%,rgba(17,24,39,0.18)_100%)]"
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
