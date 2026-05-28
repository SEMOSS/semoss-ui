import { CircleUserRound, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Env, useInsight } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
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
 * Top-right account button. Mirrors the client's <LogoutPopover>: round user
 * avatar trigger → popover with name + email + Logout. User info is pulled
 * via `GetUserInfo()` which returns a `{ [provider]: {...} }` map; we pick
 * SAML → NATIVE → first key (same precedence the client uses).
 */
export const UserMenu = () => {
	const { actions, isAuthorized } = useInsight();
	const [user, setUser] = useState<UserInfo>({});
	const [version, setVersion] = useState<VersionInfo | null>(null);
	const [loggingOut, setLoggingOut] = useState(false);
	const [open, setOpen] = useState(false);

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
			if (resp.operationType.some((t) => t.indexOf("ERROR") > -1)) return;
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
		setOpen(false);
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
					<p className="mt-2 text-foreground text-sm">Logging out</p>
				</div>
			)}

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button variant="ghost" size="icon-sm" aria-label="Account">
						<CircleUserRound className="size-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" sideOffset={6} className="w-64 p-0">
					<div className="flex items-center gap-3 border-border border-b px-4 py-3">
						<Avatar>
							<AvatarFallback>{initial}</AvatarFallback>
						</Avatar>
						<div className="flex min-w-0 flex-col">
							<span className="truncate font-medium text-foreground text-sm">
								{user.name || user.id || "User"}
							</span>
							{user.email && (
								<span className="truncate text-muted-foreground text-xs">
									{user.email}
								</span>
							)}
						</div>
					</div>
					<div className="px-4 py-3">
						<Button
							variant="default"
							className="w-full"
							onClick={handleLogout}
							disabled={loggingOut}
						>
							<LogOut className="size-4" />
							Logout
						</Button>
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
				</PopoverContent>
			</Popover>
		</>
	);
};
