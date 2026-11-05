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
import { formatToDataTestId } from "@semoss/utility/text";
import { useConfig } from "@/hooks";

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

	const raw = useConfig(
		(state) =>
			(state.config.theme as { THEME_MAP?: string } | undefined)
				?.THEME_MAP,
	);
	if (!raw) return null;

	let themeMap: {
		helpBannerOrder: string[];
		helpBannerValues: Record<
			string,
			{ src: string; label: string; disabled?: boolean }
		>;
	};
	try {
		const parsed = JSON.parse(raw);
		themeMap = typeof parsed === "string" ? JSON.parse(parsed) : parsed;
	} catch {
		return null;
	}

	if (!themeMap?.helpBannerOrder?.length) {
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
					{themeMap.helpBannerOrder
						.filter((key) => key !== "tutorials")
						.map((key) => {
							const v = themeMap.helpBannerValues[key];

							if (v) {
								return (
									<DropdownMenuItem
										key={key}
										disabled={
											v.disabled ? v.disabled : false
										}
										asChild
									>
										<a
											href={v.src}
											target="_blank"
											rel="noopener noreferrer"
											className="text-foreground no-underline"
										>
											{v.label}
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
