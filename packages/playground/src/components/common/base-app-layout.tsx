import type React from "react";
import type { ReactNode } from "react";

type BaseAppLayoutProps = {
	/** Controls max width of the content container */
	contentType?: "default" | "wide" | "narrow";
	/** Use either children or content prop as main content (legacy support) */
	children?: ReactNode;
	content?: ReactNode;
	/** Optional extra classes for main container */
	className?: string;
};

/**
 * A no-dependency, Tailwind-based app layout.
 * Wrap your pages to provide padding, centering, and optional width control.
 */
const BaseAppLayout: React.FC<BaseAppLayoutProps> = ({
	contentType = "default",
	children,
	content,
	className = "",
}) => {
	let widthClass = "";
	switch (contentType) {
		case "wide":
			widthClass = "max-w-7xl";
			break;
		case "narrow":
			widthClass = "max-w-2xl";
			break;
		default:
			widthClass = "max-w-4xl";
			break;
	}

	return (
		<div className="flex min-h-screen flex-col bg-gray-50">
			{/* Optional: insert a header here if you have one */}
			<main
				className={[
					"mx-auto w-full flex-1 px-4 py-4 md:px-8",
					widthClass,
					className,
				]
					.join(" ")
					.trim()}
			>
				{typeof content !== "undefined" ? content : children}
			</main>
			{/* Optional: insert a footer here if needed */}
		</div>
	);
};

export default BaseAppLayout;
