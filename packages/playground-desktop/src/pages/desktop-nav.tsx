import {
	BookOpenIcon,
	BotIcon,
	LogOutIcon,
	MessagesSquareIcon,
	PlusIcon,
	ServerIcon,
	SettingsIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { NavLink } from "react-router";
import { useSettingsDialog } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { Button, cn } from "@semoss/ui/next";

/** Props for {@link DesktopNav}. */
export interface DesktopNavProps {
	/** Go back to the instance picker. */
	onSwitchServer: () => void;
	/** Sign out of the instance. */
	onSignOut: () => void;
}

const NAV_ITEMS: {
	to: string;
	labelKey: string;
	icon: ComponentType<{ className?: string }>;
}[] = [
	{ to: "/new", labelKey: "nav.newChat", icon: PlusIcon },
	{ to: "/chats", labelKey: "nav.chats", icon: MessagesSquareIcon },
	{ to: "/agent", labelKey: "nav.agents", icon: BotIcon },
	{ to: "/knowledge", labelKey: "nav.knowledge", icon: BookOpenIcon },
];

/**
 * The desktop app's narrow navigation: the chat's surfaces, then settings,
 * switching servers and signing out.
 *
 * @component
 */
export const DesktopNav = ({ onSwitchServer, onSignOut }: DesktopNavProps) => {
	const { t } = useTranslation(["desktop", "sidebar"]);
	const { openSettings } = useSettingsDialog();

	return (
		<nav
			aria-label={t("app.title")}
			className="flex w-52 shrink-0 flex-col gap-1 border-border border-e bg-muted/30 p-2 pt-10"
		>
			{NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
				<NavLink
					key={to}
					to={to}
					className={({ isActive }) =>
						cn(
							"flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground text-sm hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							isActive && "bg-accent font-medium text-foreground",
						)
					}
				>
					<Icon aria-hidden className="size-4" />
					{t(labelKey)}
				</NavLink>
			))}
			<div className="mt-auto flex flex-col gap-1">
				<Button
					variant="ghost"
					className="justify-start"
					onClick={() => openSettings()}
				>
					<SettingsIcon aria-hidden />
					{t("sidebar:settings.title")}
				</Button>
				<Button
					variant="ghost"
					className="justify-start"
					onClick={onSwitchServer}
				>
					<ServerIcon aria-hidden />
					{t("auth.switchServer")}
				</Button>
				<Button
					variant="ghost"
					className="justify-start"
					onClick={onSignOut}
				>
					<LogOutIcon aria-hidden />
					{t("nav.signOut")}
				</Button>
			</div>
		</nav>
	);
};
