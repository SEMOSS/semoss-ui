import {
	type ComponentPropsWithRef,
	type ForwardedRef,
	forwardRef,
} from "react";
import { cn } from "@semoss/ui/next";

export type SectionProps = ComponentPropsWithRef<"section">;

const _Section = (
	props: SectionProps,
	ref: ForwardedRef<HTMLDivElement>,
): JSX.Element => {
	const { children, className, ...otherProps } = props;

	return (
		<section
			ref={ref}
			className={cn(
				"mb-2 border-border border-b pb-2 last:mb-0 last:border-b-0",
				className,
			)}
			{...otherProps}
		>
			{children}
		</section>
	);
};

export const Section = forwardRef(_Section);
