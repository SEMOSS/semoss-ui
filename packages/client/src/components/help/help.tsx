import { CircleHelp } from "lucide-react";
import type { JSX } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";
import { formatToDataTestId } from "@semoss/utility/text";
import { usePlatformTheme } from "@/hooks/use-platform-theme";

export interface HelpProps {
	/** Classes for the sidebar button that opens the menu */
	className?: string;
	/** Called when the menu opens or closes */
	onOpenChange?: (open: boolean) => void;
}

/**
 * Sidebar menu item listing the theme's help links. Renders nothing when the
 * theme defines no help entries.
 */
export const Help = (props: HelpProps): JSX.Element | null => {
	const { className, onOpenChange } = props;

	const { helpBannerOrder, helpBannerValues } = usePlatformTheme();

	if (helpBannerOrder.length === 0) {
		return null;
	}

	return (
		<SidebarMenuItem>
			<DropdownMenu onOpenChange={onOpenChange}>
				<DropdownMenuTrigger asChild>
					<SidebarMenuButton
						className={className}
						data-testid={formatToDataTestId("sidebar-help-btn")}
					>
						<span className="flex w-7 min-w-0 shrink-0 items-center">
							<CircleHelp className="size-4" />
						</span>
						<span className="flex-1 truncate text-left">Help</span>
					</SidebarMenuButton>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="right" align="end" sideOffset={8}>
					{helpBannerOrder
						.filter((key) => key !== "tutorials")
						.map((key) => {
							const link = helpBannerValues[key];

							if (isRecord(link)) {
								return (
									<DropdownMenuItem
										key={key}
										disabled={Boolean(link.disabled)}
										asChild
									>
										<a
											href={
												typeof link.src === "string"
													? link.src
													: undefined
											}
											target="_blank"
											rel="noopener noreferrer"
											className="text-foreground no-underline"
										>
											{typeof link.label === "string"
												? link.label
												: key}
										</a>
									</DropdownMenuItem>
								);
							}

							return null;
						})}
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarMenuItem>
	);
};
