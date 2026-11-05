import {
	CircleUserRound,
	LanguagesIcon,
	LogOutIcon,
	MonitorIcon,
	MoonIcon,
	SunIcon,
} from "lucide-react";
import { useState } from "react";
import { LANGUAGES, useTranslation } from "@semoss/i18n";
import { Session, useConfig, useSession } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	Button,
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
	Spinner,
	useTheme,
} from "@semoss/ui/next";

/**
 * Account dropdown — mirrors the playground's NavUser (theme submenu +
 * logout) plus the client's LogoutPopover (user header + version footer).
 *
 * - User info: the SDK session's signed in user.
 * - Theme: `useTheme()` from @semoss/ui/next; sub-menu with Light / Dark /
 *   System options identical to the playground.
 * - Version + build datetime: the SDK config's `version`.
 */
export const UserMenu = () => {
	const user = useSession((state) => state.user);
	const version = useConfig((state) => state.config?.version);
	const { theme, setTheme } = useTheme();
	const { t, i18n } = useTranslation("chrome");

	const selectedLanguage = LANGUAGES.find(
		(lang) => lang.code === i18n.language,
	);
	const [loggingOut, setLoggingOut] = useState(false);

	const handleLogout = async () => {
		setLoggingOut(true);
		try {
			await Session.logout();
		} catch (error) {
			// the session stays signed in; the menu stays usable for a retry
			console.error("[terminal] logout failed", error);
		} finally {
			setLoggingOut(false);
		}
	};

	const initial = (user?.name || user?.id || "U").charAt(0).toUpperCase();

	return (
		<>
			{loggingOut && (
				<div className="fixed inset-0 z-[1501] flex flex-col items-center justify-center bg-background/50">
					<Spinner className="size-8" />
					<p className="mt-2 text-foreground text-sm">
						{t("userMenu.loggingOut")}
					</p>
				</div>
			)}

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={t("userMenu.accountAria")}
					>
						<CircleUserRound className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					sideOffset={6}
					className="w-60 p-0"
				>
					{/* User identity header (read-only) */}
					<div className="flex items-center gap-3 border-border border-b px-3 py-3">
						<Avatar>
							<AvatarFallback>{initial}</AvatarFallback>
						</Avatar>
						<div className="flex min-w-0 flex-col">
							<span className="truncate font-medium text-foreground text-sm">
								{user?.name ||
									user?.id ||
									t("userMenu.defaultUser")}
							</span>
							{user?.email && (
								<span className="truncate text-muted-foreground text-xs">
									{user.email}
								</span>
							)}
						</div>
					</div>

					<div className="p-1">
						{/* Theme submenu (playground pattern) */}
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								{theme === "dark" ? (
									<MoonIcon />
								) : theme === "system" ? (
									<MonitorIcon />
								) : (
									<SunIcon />
								)}
								{theme === "dark"
									? t("userMenu.theme.dark")
									: theme === "system"
										? t("userMenu.theme.system")
										: t("userMenu.theme.light")}
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<DropdownMenuCheckboxItem
										checked={theme === "light"}
										onCheckedChange={() =>
											setTheme("light")
										}
									>
										<SunIcon />
										{t("userMenu.theme.light")}
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={theme === "dark"}
										onCheckedChange={() => setTheme("dark")}
									>
										<MoonIcon />
										{t("userMenu.theme.dark")}
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={theme === "system"}
										onCheckedChange={() =>
											setTheme("system")
										}
									>
										<MonitorIcon />
										{t("userMenu.theme.system")}
									</DropdownMenuCheckboxItem>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>

						{/* Language submenu — same pattern as the
						    playground's NavUser. Persisted to localStorage by
						    react-i18next's LanguageDetector. */}
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<LanguagesIcon />
								{selectedLanguage?.label}
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									{LANGUAGES.map((lang) => (
										<DropdownMenuCheckboxItem
											key={lang.code}
											checked={
												selectedLanguage?.code ===
												lang.code
											}
											onCheckedChange={() =>
												i18n.changeLanguage(lang.code)
											}
										>
											{lang.label}
										</DropdownMenuCheckboxItem>
									))}
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>

						<DropdownMenuSeparator />

						<DropdownMenuItem
							onClick={handleLogout}
							disabled={loggingOut}
						>
							<LogOutIcon />
							{t("userMenu.logOut")}
						</DropdownMenuItem>
					</div>

					{version && (version.version || version.datetime) && (
						<div className="flex flex-col items-center gap-0.5 border-border border-t px-4 py-3">
							{version.version && (
								<span className="truncate text-muted-foreground text-xs">
									{version.version}
								</span>
							)}
							{version.datetime && (
								<span className="truncate text-muted-foreground text-xs">
									{version.datetime}
								</span>
							)}
						</div>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};
