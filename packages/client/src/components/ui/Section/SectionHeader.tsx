import {
	type ComponentPropsWithRef,
	type ForwardedRef,
	forwardRef,
} from "react";
import { cn } from "@semoss/ui/next";

export interface SectionHeaderProps extends ComponentPropsWithRef<"div"> {
	actions?: React.ReactNode;
}

const _SectionHeader = (
	props: SectionHeaderProps,
	ref: ForwardedRef<HTMLDivElement>,
): JSX.Element => {
	const { children, actions, className, ...otherProps } = props;

	return (
		<div
			ref={ref}
			className={cn(
				"mb-4 flex w-full items-center justify-between gap-2",
				className,
			)}
			{...otherProps}
		>
			<h6 className="font-semibold text-base">{children}</h6>
			{actions}
		</div>
	);
};

export const SectionHeader = forwardRef(_SectionHeader);
