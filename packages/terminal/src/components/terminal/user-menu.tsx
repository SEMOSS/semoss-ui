import {
	CircleUserRound,
	LanguagesIcon,
	LogOutIcon,
	MonitorIcon,
	MoonIcon,
	SunIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LANGUAGES, useTranslation } from "@semoss/i18n";
import { Env, useInsight } from "@semoss/sdk/react";
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
import { runPixel } from "../../utility/pixel";

interface UserInfo {
	id?: string;
	name?: string;
	email?: string;
}

interface VersionInfo {
	version: string;
	datetime: string;
}

/**
 * Account dropdown — mirrors the playground's NavUser (theme submenu +
 * logout) plus the client's LogoutPopover (user header + version footer).
 *
 * - User info: `GetUserInfo()` pixel; provider precedence SAML → NATIVE →
 *   first key (same as the client).
 * - Theme: `useTheme()` from @semoss/ui/next; sub-menu with Light / Dark /
 *   System options identical to the playground.
 * - Version + build datetime: `GET ${MODULE}/api/config` (same endpoint the
 *   client reads in monolith.store).
 */
export const UserMenu = () => {
	const { actions, isAuthorized } = useInsight();
	const { theme, setTheme } = useTheme();
	const { t, i18n } = useTranslation("chrome");
	const [user, setUser] = useState<UserInfo>({});

	const selectedLanguage = LANGUAGES.find(
		(lang) => lang.code === i18n.language,
	);
	const [version, setVersion] = useState<VersionInfo | null>(null);
	const [loggingOut, setLoggingOut] = useState(false);

	// Fetch the current user once authorized
	useEffect(() => {
		if (!isAuthorized) return;
		let cancelled = false;
		(async () => {
			const resp = await runPixel<
				Record<
					string,
					{
						id?: string;
						name?: string;
						email?: string;
					}
				>
			>(actions, `GetUserInfo();`);
			if (cancelled || !resp) return;
			if (
				resp.operationType.some(
					(opType) => opType.indexOf("ERROR") > -1,
				)
			)
				return;
			const output = resp.output ?? {};
			// SAML > NATIVE > first present
			const picked =
				output.SAML ??
				output.NATIVE ??
				output[Object.keys(output)[0] ?? ""] ??
				null;
			if (picked) {
				setUser({
					id: picked.id,
					name: picked.name,
					email: picked.email,
				});
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [actions, isAuthorized]);

	// Fetch app version + build datetime once authorized. Mirrors the client's
	// LogoutPopover which reads these from `GET ${MODULE}/api/config`.
	useEffect(() => {
		if (!isAuthorized) return;
		let cancelled = false;
		(async () => {
			try {
				const resp = await fetch(`${Env.MODULE}/api/config`, {
					credentials: "include",
				});
				if (!resp.ok) return;
				const data = (await resp.json()) as {
					version?: { version?: string; datetime?: string };
				};
				if (cancelled) return;
				if (data?.version?.version || data?.version?.datetime) {
					setVersion({
						version: data.version.version ?? "",
						datetime: data.version.datetime ?? "",
					});
				}
			} catch {
				// silent — version footer is purely informational
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isAuthorized]);

	const handleLogout = async () => {
		setLoggingOut(true);
		try {
			await actions.logout();
		} finally {
			setLoggingOut(false);
		}
	};

	const initial = (user.name || user.id || "U").charAt(0).toUpperCase();

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
								{user.name ||
									user.id ||
									t("userMenu.defaultUser")}
							</span>
							{user.email && (
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
