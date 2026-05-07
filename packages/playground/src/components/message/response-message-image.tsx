import { forwardRef, useState } from "react";

interface ResponseMessageImageProps {
	src: string;
	alt: string;
	onClick: () => void;
}

export const ResponseMessageImage = forwardRef<
	HTMLButtonElement,
	ResponseMessageImageProps
>(({ src, alt, onClick }, ref) => {
	const [dimensions, setDimensions] = useState<string>("");

	return (
		<button
			ref={ref}
			type="button"
			className="relative w-fit cursor-zoom-in overflow-hidden rounded-lg border border-border"
			onClick={onClick}
			aria-label={`View ${alt}`}
		>
			<img
				className="max-h-[480px] max-w-full object-contain"
				src={src}
				alt={alt}
				onLoad={(e) => {
					const img = e.currentTarget;
					setDimensions(`${img.naturalWidth}×${img.naturalHeight}`);
				}}
			/>
			{dimensions && (
				<span className="absolute right-2 bottom-2 hidden rounded bg-background/80 px-1.5 py-0.5 text-foreground text-xs shadow-sm backdrop-blur-sm group-hover:inline">
					{dimensions}
				</span>
			)}
		</button>
	);
});

ResponseMessageImage.displayName = "ResponseMessageImage";
