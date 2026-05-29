"use client";

import {
	LanguagesIcon,
	LogOutIcon,
	MonitorIcon,
	MoonIcon,
	SunIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LANGUAGES, useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
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
	useTheme,
} from "@semoss/ui/next";
import { useChat, useRoot } from "@/hooks";
import { toInitials } from "@/utility";

export const NavUser = () => {
	const { t, i18n } = useTranslation("common");
	const { isMobile } = useSidebar();
	const { actions } = useInsight();
	const { chat } = useChat();
	const { theme, setTheme } = useTheme();
	const { root } = useRoot();

	const navigate = useNavigate();

	const userName = chat.user.name;

	const selectedLanguage = LANGUAGES.find(
		(lang) => lang.code === i18n.language,
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="flex h-auto w-full justify-start rounded-lg px-1 py-1 font-normal group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
				>
					<Avatar className="h-8 w-8 shrink-0 rounded-lg">
						<AvatarImage src={""} alt={userName} />
						<AvatarFallback className="rounded-lg bg-primary/10">
							{toInitials(userName)}
						</AvatarFallback>
					</Avatar>
					<span className="truncate text-sm group-data-[collapsible=icon]:hidden">
						{userName}
					</span>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
				side={isMobile ? "bottom" : "right"}
				align="end"
				sideOffset={4}
			>
				{root.theme.featureFlags?.enableDarkMode && (
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							{theme === "dark" ? (
								<MoonIcon />
							) : theme === "system" ? (
								<MonitorIcon />
							) : (
								<SunIcon />
							)}
							{theme === "dark" ? (
								<>
									Dark
									<span className="ms-1 self-center rounded border px-1 py-0.5 font-semibold text-[9px] leading-none">
										BETA
									</span>
								</>
							) : theme === "system" ? (
								<>
									System
									<span className="ms-1 self-center rounded border px-1 py-0.5 font-semibold text-[9px] leading-none">
										BETA
									</span>
								</>
							) : (
								"Light"
							)}
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent>
								<DropdownMenuCheckboxItem
									checked={theme === "light"}
									onCheckedChange={() => setTheme("light")}
								>
									<SunIcon />
									Light
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={theme === "dark"}
									onCheckedChange={() => setTheme("dark")}
								>
									<MoonIcon />
									Dark
									<span className="ms-auto self-center rounded border px-1 py-0.5 font-semibold text-[9px] leading-none">
										BETA
									</span>
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={theme === "system"}
									onCheckedChange={() => setTheme("system")}
								>
									<MonitorIcon />
									System
									<span className="ms-auto self-center rounded border px-1 py-0.5 font-semibold text-[9px] leading-none">
										BETA
									</span>
								</DropdownMenuCheckboxItem>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
				)}
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
