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
	/** Rendered icon — placed inside a 64x64 wrapper. Omit for no-icon headers. */
	icon?: ReactNode;
	/** Entity display name shown as the h1. */
	name: string;
	/** Entity id shown as a muted line below the name with a copy button. */
	id?: string;
	/** Tooltip text + button aria-label for the copy action. Default: "Copy ID". */
	copyLabel?: string;
	/** Right-aligned action buttons (edit, export, admin toggle, etc.). */
	actions?: ReactNode;
	/** Optional data-testid for the h1. */
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

	return (
		<div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
			{icon && (
				<div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden bg-transparent">
					{icon}
				</div>
			)}

			<div className="flex min-w-0 flex-1 flex-col">
				<h1
					className="break-words font-semibold text-2xl text-foreground leading-tight md:overflow-hidden md:text-ellipsis md:whitespace-nowrap md:text-[30px]"
					data-testid={nameTestId}
				>
					{name}
				</h1>
				{id && (
					<div className="flex flex-row items-center gap-1">
						<span
							className="text-muted-foreground text-sm"
							data-testid={idTestId}
						>
							{id}
						</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={copyLabel}
									onClick={handleCopy}
									data-testid={copyTestId}
								>
									<Copy className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{copyLabel}</TooltipContent>
						</Tooltip>
					</div>
				)}
			</div>

			{actions && (
				<div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap md:justify-end">
					{actions}
				</div>
			)}
		</div>
	);
};
