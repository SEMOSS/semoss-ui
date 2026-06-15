import { Copy } from "lucide-react";
import type { ReactNode } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";

interface EntityHeaderProps {
	/** Rendered icon — placed inside a sized wrapper. Omit for no-icon headers. */
	icon?: ReactNode;
	/** Entity display name shown as the title. */
	name: string;
	/** Entity id shown as a muted line below the name. Optional copy button. */
	id?: string;
	/**
	 * Visual density:
	 * - "default": page-level header (text-2xl, 64x64 icon).
	 * - "compact": tighter page header (text-xl, 48x48 icon).
	 * - "sm": modal/inline header (text-base, 24x24 icon, always single-line + truncate).
	 */
	size?: "default" | "compact" | "sm";
	/** Show the inline copy-id button next to the id. Default: true when id is present. */
	copyable?: boolean;
	/** Tooltip text + button aria-label for the copy action. Default: "Copy ID". */
	copyLabel?: string;
	/** Right-aligned action buttons (edit, export, admin toggle, etc.). */
	actions?: ReactNode;
	/** Optional data-testid for the name element. */
	nameTestId?: string;
	/** Optional data-testid for the id span. */
	idTestId?: string;
	/** Optional data-testid for the copy button. */
	copyTestId?: string;
}

export const EntityHeader = ({
	icon,
	name,
	id,
	size = "default",
	copyable = true,
	copyLabel = "Copy ID",
	actions,
	nameTestId,
	idTestId,
	copyTestId,
}: EntityHeaderProps) => {
	const handleCopy = () => {
		if (!id) return;
		try {
			navigator.clipboard.writeText(id);
			toast.success("ID copied to clipboard");
		} catch (e) {
			console.error(e);
			toast.error("Failed to copy ID");
		}
	};

	const isSm = size === "sm";
	const isCompact = size === "compact";

	// Wrapper layout: "sm" stays horizontal at every viewport (modal use-case);
	// "default" / "compact" stack on mobile and lay out as a row on md+.
	const wrapperClass = isSm
		? "flex w-full flex-row items-center gap-3"
		: `flex w-full flex-col ${
				isCompact ? "gap-3" : "gap-4"
			} md:flex-row md:items-center`;

	const iconWrapperSize = isSm
		? "size-6"
		: isCompact
			? "h-12 w-12"
			: "h-16 w-16";

	// "sm" truncates at every viewport. The larger sizes break-words on mobile
	// and switch to single-line + ellipsis at md+ to preserve the pre-existing
	// page-header behavior on small screens.
	const nameClass = isSm
		? "min-w-0 truncate font-medium text-base text-foreground leading-tight"
		: isCompact
			? "break-words font-semibold text-foreground text-xl leading-tight md:overflow-hidden md:text-ellipsis md:whitespace-nowrap md:text-2xl"
			: "break-words font-semibold text-2xl text-foreground leading-tight md:overflow-hidden md:text-ellipsis md:whitespace-nowrap md:text-[30px]";

	const idClass = isSm
		? "min-w-0 truncate text-muted-foreground text-xs"
		: isCompact
			? "text-muted-foreground text-xs"
			: "text-muted-foreground text-sm";

	return (
		<div className={wrapperClass}>
			{icon && (
				<div
					className={`flex flex-shrink-0 items-center justify-center overflow-hidden bg-transparent ${iconWrapperSize}`}
				>
					{icon}
				</div>
			)}

			<div className="flex min-w-0 flex-1 flex-col">
				{isSm ? (
					<span className={nameClass} data-testid={nameTestId}>
						{name}
					</span>
				) : (
					<h1 className={nameClass} data-testid={nameTestId}>
						{name}
					</h1>
				)}
				{id && (
					<div
						className={`flex flex-row items-center ${isSm ? "min-w-0 gap-0.5" : "gap-1"}`}
					>
						<span
							className={idClass}
							data-testid={idTestId}
							title={isSm ? id : undefined}
						>
							{id}
						</span>
						{copyable && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size={isSm ? "icon-sm" : "icon-sm"}
										aria-label={copyLabel}
										onClick={handleCopy}
										data-testid={copyTestId}
										className={isSm ? "size-5" : undefined}
									>
										<Copy
											className={
												isSm ? "size-3" : "size-4"
											}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>{copyLabel}</TooltipContent>
							</Tooltip>
						)}
					</div>
				)}
			</div>

			{actions && (
				<div
					className={
						isSm
							? "flex shrink-0 items-center gap-1"
							: "flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap md:justify-end"
					}
				>
					{actions}
				</div>
			)}
		</div>
	);
};
