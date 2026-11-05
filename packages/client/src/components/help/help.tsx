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
import { useThemeConfig } from "@/hooks";

/** One help link the theme lists. */
interface HelpLink {
	src: string;
	label: string;
	disabled: boolean;
}

/**
 * Read one help link from the theme's `helpBannerValues`.
 *
 * @param values - The theme's help links by key, as the server sent them.
 * @param key - The link to read.
 * @returns The link, or null when the theme has no valid link for the key.
 */
const getHelpLink = (values: unknown, key: string): HelpLink | null => {
	const value = isRecord(values) ? values[key] : undefined;
	if (!isRecord(value)) {
		return null;
	}

	return {
		src: typeof value.src === "string" ? value.src : "",
		label: typeof value.label === "string" ? value.label : "",
		// a theme may send the flag as text, which always disabled the link
		disabled: Boolean(value.disabled) && value.disabled !== "false",
	};
};

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

	const { helpBannerOrder, helpBannerValues } = useThemeConfig();

	// the theme comes from the server, so its order may not be a list
	if (!Array.isArray(helpBannerOrder) || helpBannerOrder.length === 0) {
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
							const v = getHelpLink(helpBannerValues, key);

							if (v) {
								return (
									<DropdownMenuItem
										key={key}
										disabled={v.disabled}
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
