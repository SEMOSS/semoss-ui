import { PanelRightOpenIcon } from "lucide-react";
import type { ReactElement, ReactNode, Ref } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useIsMobile,
} from "@semoss/ui/next";

export interface OpenWorkspaceButtonProps {
	/** Focus returns here when the Workspace closes. */
	ref?: Ref<HTMLButtonElement>;
	/** The Workspace's places; when given, the button lists them in a menu. */
	menuItems?: ReactNode;
	/** Opens the Workspace when there are no places to list. */
	onOpen: () => void;
	/** Called when the places menu opens or closes. */
	onMenuOpenChange?: (isOpen: boolean) => void;
	/** Id of the Workspace region the button opens. */
	controlsId: string;
}

/** The control that opens a closed Workspace when the rail is not on screen. */
export function OpenWorkspaceButton({
	ref,
	menuItems,
	onOpen,
	onMenuOpenChange,
	controlsId,
}: OpenWorkspaceButtonProps) {
	const { t } = useTranslation("room");
	const isMobile = useIsMobile();
	const label = t("studio.openWorkArea");
	const size = isMobile ? "icon-lg" : "icon-sm";
	const className = cn(
		"z-10",
		isMobile
			? "fixed end-2 top-1 min-h-11 min-w-11"
			: "absolute end-2 top-2",
	);
	const icon = (
		<PanelRightOpenIcon aria-hidden="true" className="rtl:-scale-x-100" />
	);
	const withTooltip = (trigger: ReactElement) =>
		isMobile ? (
			trigger
		) : (
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>{trigger}</TooltipTrigger>
				<TooltipContent>{label}</TooltipContent>
			</Tooltip>
		);

	if (!menuItems) {
		return withTooltip(
			<Button
				ref={ref}
				type="button"
				variant="ghost"
				size={size}
				className={className}
				aria-label={label}
				aria-expanded={false}
				aria-controls={controlsId}
				onClick={onOpen}
			>
				{icon}
			</Button>,
		);
	}
	return (
		<DropdownMenu onOpenChange={onMenuOpenChange}>
			{withTooltip(
				<DropdownMenuTrigger asChild>
					<Button
						ref={ref}
						type="button"
						variant="ghost"
						size={size}
						className={className}
						aria-label={label}
					>
						{icon}
					</Button>
				</DropdownMenuTrigger>,
			)}
			<DropdownMenuContent align="end" className="w-56">
				{menuItems}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
