"use client";

import { LanguagesIcon, LogOutIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LANGUAGES, useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	useSidebar,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";
import { toInitials } from "@/utility";

export const NavUser = () => {
	const { t, i18n } = useTranslation("common");
	const { isMobile } = useSidebar();
	const { actions } = useInsight();
	const { chat } = useChat();

	const navigate = useNavigate();

	const userName = chat.user.name;

	const selectedLanguage = LANGUAGES.find(
		(lang) => lang.code === i18n.language,
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-accent">
					<Avatar className="h-8 w-8 flex-shrink-0 rounded-lg">
						<AvatarImage src={""} alt={userName} />
						<AvatarFallback className="rounded-lg bg-primary/10">
							{toInitials(userName)}
						</AvatarFallback>
					</Avatar>
					<span className="line-clamp-2 text-sm group-data-[collapsible=icon]:hidden">
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
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<LanguagesIcon />
						{selectedLanguage?.label}
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
				<DropdownMenuItem
					onClick={async () => {
						await actions.logout();

						navigate("/login");
					}}
				>
					<LogOutIcon />
					{t("navigation.logOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
