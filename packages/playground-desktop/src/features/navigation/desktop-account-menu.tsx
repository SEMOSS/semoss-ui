import {
	ChevronsUpDownIcon,
	LanguagesIcon,
	LogOutIcon,
	ServerIcon,
	SettingsIcon,
} from "lucide-react";
import { useSettingsDialog } from "@semoss/chat";
import { LANGUAGES, useTranslation } from "@semoss/i18n";
import { useSession } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	SidebarMenuButton,
} from "@semoss/ui/next";
import { buildInitials } from "@semoss/utility/text";
import { formatShortcut } from "./use-desktop-shortcuts";

/** Props for {@link DesktopAccountMenu}. */
export interface DesktopAccountMenuProps {
	/** The name of the server in use. */
	instanceName: string;
	/** Go back to the instance picker. */
	onSwitchServer: () => void;
	/** Sign out of the instance. */
	onSignOut: () => void;
}

/**
 * Who is signed in, and where, at the foot of the sidebar. It opens the
 * account menu: settings, the app's language, switching servers and signing
 * out.
 *
 * @component
 */
export const DesktopAccountMenu = ({
	instanceName,
	onSwitchServer,
	onSignOut,
}: DesktopAccountMenuProps) => {
	const { t, i18n } = useTranslation(["desktop", "sidebar"]);
	const { openSettings } = useSettingsDialog();
	const userName = useSession((state) => state.user?.name ?? "");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton
					size="lg"
					tooltip={userName || instanceName}
					className="data-[state=open]:bg-sidebar-accent"
				>
					<Avatar className="size-8 shrink-0 rounded-lg">
						<AvatarFallback className="rounded-lg bg-primary/10 text-xs">
							{buildInitials(userName, 2, true)}
						</AvatarFallback>
					</Avatar>
					<span className="flex min-w-0 flex-1 flex-col text-start leading-tight">
						<span className="truncate font-medium">{userName}</span>
						<span className="truncate text-muted-foreground text-xs">
							{instanceName}
						</span>
					</span>
					<ChevronsUpDownIcon
						aria-hidden
						className="ms-auto text-muted-foreground"
					/>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side="top"
				align="start"
				sideOffset={4}
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
			>
				<DropdownMenuItem onSelect={() => openSettings()}>
					<SettingsIcon aria-hidden />
					{t("sidebar:settings.title")}
					<DropdownMenuShortcut>
						{formatShortcut(",")}
					</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<LanguagesIcon aria-hidden />
						{t("nav.language")}
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent>
							{LANGUAGES.map((language) => (
								<DropdownMenuCheckboxItem
									key={language.code}
									checked={i18n.language === language.code}
									onCheckedChange={() =>
										void i18n.changeLanguage(language.code)
									}
								>
									{language.label}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuLabel className="truncate font-normal text-muted-foreground text-xs">
					{instanceName}
				</DropdownMenuLabel>
				<DropdownMenuItem onSelect={onSwitchServer}>
					<ServerIcon aria-hidden />
					{t("auth.switchServer")}
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={onSignOut}>
					<LogOutIcon aria-hidden />
					{t("nav.signOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
