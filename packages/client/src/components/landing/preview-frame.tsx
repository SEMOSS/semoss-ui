import { cn } from "@semoss/ui/next";

interface PreviewFrameProps {
	/** Light mode preview image. Ignored when `children` is provided. */
	src?: string;

	/** Dark mode preview image */
	darkSrc?: string;

	/** Accessible description; omit when the preview is purely decorative */
	alt?: string;

	/** Custom preview content rendered instead of an image */
	children?: React.ReactNode;

	className?: string;

	/** Extra classes for the inner, clipping frame */
	innerClassName?: string;
}

/**
 * Gradient double-bordered frame that holds an app preview. The outer frame
 * supplies the gradient and gutter, the inner frame clips the content.
 */
export const PreviewFrame = ({
	src,
	darkSrc,
	alt,
	children,
	className,
	innerClassName,
}: PreviewFrameProps) => {
	const isDecorative = !alt;

	return (
		<div
			className={cn(
				"rounded-3xl border border-border bg-gradient-to-br from-card via-primary/5 to-primary/10 p-2",
				className,
			)}
		>
			<div
				className={cn(
					"h-full w-full overflow-hidden rounded-2xl border border-border",
					innerClassName,
				)}
			>
				{children ?? (
					<>
						<img
							src={src}
							alt={alt ?? ""}
							aria-hidden={isDecorative || undefined}
							className={cn(
								"h-full w-full object-cover object-center",
								darkSrc && "dark:hidden",
							)}
						/>
						{darkSrc ? (
							<img
								src={darkSrc}
								alt={alt ?? ""}
								aria-hidden={isDecorative || undefined}
								className="hidden h-full w-full object-cover object-center dark:block"
							/>
						) : null}
					</>
				)}
			</div>
		</div>
	);
};
