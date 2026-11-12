import type { ReactNode } from "react";
import { cn, Muted } from "@semoss/ui/next";
import ErrorSvg from "@/assets/img/Error.svg";

interface ErrorStateProps {
	/** Heading of the error. */
	title?: string;

	/** Explanation shown under the title. */
	description?: ReactNode;

	/** Extra lines or the recovery action, shown under the description. */
	children?: ReactNode;

	/** Classes merged onto the full screen wrapper, such as its positioning. */
	className?: string;
}

/**
 * The client's error screen: the error illustration, a title, a description
 * and an optional action, centered in the screen.
 */
export const ErrorState = ({
	title,
	description,
	children,
	className,
}: ErrorStateProps) => {
	return (
		<div
			className={cn(
				"flex h-screen w-screen flex-col items-center justify-center gap-2 p-4 text-center",
				className,
			)}
		>
			<img src={ErrorSvg} className="h-[25%] max-h-[200px]" alt="" />
			{title ? <h2 className="font-semibold text-xl">{title}</h2> : null}
			{description ? <Muted>{description}</Muted> : null}
			{children}
		</div>
	);
};
