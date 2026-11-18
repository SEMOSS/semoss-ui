"use client";

import { LanguagesIcon, LogOutIcon, MapIcon, SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { LANGUAGES, useTranslation } from "@semoss/i18n";
import { useSession } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	toast,
	useSidebar,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { buildInitials } from "@semoss/utility/text";
import { useSettingsDialog } from "@/features/settings/settings-dialog.context";
import { useTour } from "@/hooks";
import { usePlaygroundTheme } from "@/hooks/use-playground-theme";

/**
 * The signed in user's name and avatar at the foot of the sidebar. Clicking it
 * opens the account menu: settings, language, the guided tour, and log out.
 * The tour's last step points here, where it can be replayed.
 */
export const NavUser = () => {
	const { t, i18n } = useTranslation(["common", "sidebar"]);
	const { isMobile } = useSidebar();
	const userName = useSession((state) => state.user?.name) ?? "";
	const logout = useSession((state) => state.logout);
	const theme = usePlaygroundTheme();
	const { startTour } = useTour();
	const { openSettings } = useSettingsDialog();

	const navigate = useNavigate();

	const handleLogout = async () => {
		try {
			await logout();
			navigate("/login");
		} catch (e) {
			toast.error(getErrorMessage(e));
		}
	};

	const selectedLanguage = LANGUAGES.find(
		(lang) => lang.code === i18n.language,
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div
					data-tour="tour-take-tour"
					className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
				>
					<Avatar className="h-8 w-8 shrink-0 rounded-lg">
						<AvatarImage src={""} alt={userName} />
						<AvatarFallback className="rounded-lg bg-primary/10">
							{buildInitials(userName, 2, true)}
						</AvatarFallback>
					</Avatar>
					<span className="truncate text-sm group-data-[collapsible=icon]:hidden">
						{userName}
					</span>
				</div>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
				side={isMobile ? "bottom" : "right"}
				align="end"
				sideOffset={4}
			>
				<DropdownMenuItem onSelect={() => openSettings()}>
					<SettingsIcon />
					{t("sidebar:userMenu.settings")}
				</DropdownMenuItem>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<LanguagesIcon />
						{t("sidebar:userMenu.language")}
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent>
							{LANGUAGES.map((lang) => {
								return (
									<DropdownMenuCheckboxItem
										key={lang.code}
										checked={
											selectedLanguage?.code === lang.code
										}
										onCheckedChange={() =>
											i18n.changeLanguage(lang.code)
										}
									>
										{lang.label}
									</DropdownMenuCheckboxItem>
								);
							})}
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
				{theme.tour?.show !== false ? (
					<DropdownMenuItem
						onSelect={() => {
							navigate("/new");
							startTour();
						}}
					>
						<MapIcon />
						{t("sidebar:takeTour")}
					</DropdownMenuItem>
				) : null}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleLogout}>
					<LogOutIcon />
					{t("navigation.logOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
