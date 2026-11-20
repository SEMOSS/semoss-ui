import { Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Item,
	ItemActions,
	ItemContent,
	ItemTitle,
	Spinner,
} from "@semoss/ui/next";
import type { SavedServers } from "../../../contract/ipc-contract";
import {
	formatServerAddress,
	isSameServer,
	type ServerConfig,
} from "../../../contract/server-connection";

/** Props for {@link SavedServerList}. */
interface SavedServerListProps {
	/** The saved servers and the one in use. */
	saved: SavedServers;
	/** Use a server; the window then opens on it. */
	onSwitch: (server: ServerConfig) => Promise<void>;
	/** Forget a server and delete its sign in. */
	onForget: (server: ServerConfig) => Promise<void>;
}

/**
 * The servers the app keeps a sign in for: the one in use, an Activate for
 * each of the others, and a Remove for every one, which asks first since it signs
 * the user out of that server.
 */
export const SavedServerList = ({
	saved,
	onSwitch,
	onForget,
}: SavedServerListProps) => {
	const { t } = useTranslation("desktop");
	const headingId = useId();
	// the address being switched to or removed, so its buttons show it
	const [pending, setPending] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [removing, setRemoving] = useState<ServerConfig | null>(null);

	/**
	 * Run one action on a server, showing a failure under the list.
	 *
	 * @param server - The server.
	 * @param action - Switch or forget.
	 * @returns Whether it worked.
	 */
	const run = async (
		server: ServerConfig,
		action: (server: ServerConfig) => Promise<void>,
	): Promise<boolean> => {
		setPending(formatServerAddress(server));
		setError(null);
		try {
			await action(server);
			return true;
		} catch (cause) {
			setError(
				t("servers.failed", {
					message:
						cause instanceof Error ? cause.message : String(cause),
				}),
			);
			return false;
		} finally {
			setPending(null);
		}
	};

	const handleRemove = async (): Promise<void> => {
		if (!removing) return;
		if (await run(removing, onForget)) setRemoving(null);
	};

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-2">
			<h2 id={headingId} className="font-medium text-sm">
				{t("servers.listLabel")}
			</h2>
			<ul className="flex flex-col gap-2">
				{saved.servers.map((server) => {
					const address = formatServerAddress(server);
					const isActive =
						saved.active !== null &&
						isSameServer(server, saved.active);
					const isPending = pending === address;
					return (
						<li key={address}>
							<Item variant="outline" size="sm">
								<ItemContent className="min-w-0">
									<ItemTitle className="break-all">
										{address}
									</ItemTitle>
								</ItemContent>
								<ItemActions>
									{isActive ? (
										<Badge variant="secondary">
											{t("servers.current")}
										</Badge>
									) : (
										<Button
											size="sm"
											variant="outline"
											disabled={pending !== null}
											aria-label={t(
												"servers.switchLabel",
												{
													server: address,
												},
											)}
											onClick={() =>
												void run(server, onSwitch)
											}
										>
											{isPending && !removing ? (
												<Spinner aria-hidden />
											) : null}
											{t("servers.switch")}
										</Button>
									)}
									<Button
										size="icon-sm"
										variant="ghost"
										className="text-destructive hover:bg-destructive/10 hover:text-destructive"
										disabled={pending !== null}
										aria-label={t("servers.removeLabel", {
											server: address,
										})}
										onClick={() => setRemoving(server)}
									>
										<Trash2Icon aria-hidden />
									</Button>
								</ItemActions>
							</Item>
						</li>
					);
				})}
			</ul>
			{error && !removing ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<Dialog
				open={removing !== null}
				onOpenChange={(isOpen) => {
					if (!isOpen && pending === null) {
						setRemoving(null);
						setError(null);
					}
				}}
			>
				<DialogContent showCloseButton={pending === null}>
					<DialogHeader>
						<DialogTitle>{t("servers.removeTitle")}</DialogTitle>
						<DialogDescription className="break-all">
							{t("servers.removeDescription", {
								server: removing
									? formatServerAddress(removing)
									: "",
							})}
						</DialogDescription>
					</DialogHeader>
					{error ? (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={pending !== null}
							onClick={() => {
								setRemoving(null);
								setError(null);
							}}
						>
							{t("connect.cancel")}
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={pending !== null}
							onClick={() => void handleRemove()}
						>
							{pending !== null ? <Spinner aria-hidden /> : null}
							{t("servers.removeConfirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
};
