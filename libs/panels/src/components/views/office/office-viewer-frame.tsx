import type { ReactNode } from "react";
import { cn, useTheme } from "@semoss/ui/next";

interface OfficeViewerFrameProps {
	/** The retained viewer and any host-owned controls. */
	children: ReactNode;
	/** Accessible name identifying the open file. */
	label: string;
	/** Additional host layout classes. Vendor CSS scopes belong inside this frame. */
	className?: string;
}

/** Scopes Office chrome to the host theme without restyling document content. */
export const OfficeViewerFrame = ({
	children,
	label,
	className,
}: OfficeViewerFrameProps) => {
	const { resolvedTheme } = useTheme();

	return (
		<section
			aria-label={label}
			data-office-theme={resolvedTheme}
			className={cn(
				"office-viewer-scope relative size-full min-h-0 min-w-0 bg-background font-sans text-foreground",
				className,
			)}
		>
			{children}
		</section>
	);
};
