import { DownloadIcon, MessageSquarePlusIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	FileExplorer,
	type FileExplorerAdapter,
	FileExplorerHeader,
	type FileExplorerItemActions,
	FileExplorerNewAction,
	type FileExplorerPrimaryAction,
	FileExplorerRefreshAction,
	type FileItem,
	type FileMode,
	NewFileOverlay,
	useFileExplorer,
} from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import type { ConnectorAccount } from "../core/connector.types";
import {
	classifyConnectorError,
	toConnectorError,
} from "../core/connector-pixel";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../core/use-connector-saver";
import { ConnectorViewerStatus } from "./connector-viewer-status";

/**
 * The explorer's Pixels run in the viewer's insight, where saved files land,
 * whatever the adapter reads from.
 */
const INSIGHT_MODE: FileMode = { type: "INSIGHT" };

/** Props for {@link ConnectorFileExplorer}. */
interface ConnectorFileExplorerProps {
	/**
	 * Where the files come from, such as a drive's adapter. Keep its identity
	 * stable: a new adapter starts the explorer over.
	 */
	adapter: FileExplorerAdapter;
	/** The app's name, such as OneDrive, for messages and the open action. */
	serviceName: string;
	/** The account the files are in, for the sign in prompt. */
	account?: ConnectorAccount;
	/** Saves rows into the chat's files, and adds them to context. */
	saver: ConnectorSaver;
	/**
	 * How to save a row into the chat's files, or undefined for a row that
	 * cannot be saved, such as a folder.
	 */
	getSaveRequest: (item: FileItem) => ConnectorSaveRequest | undefined;
	/** Where a row opens in its own app, when it does. */
	getWebUrl: (item: FileItem) => string | undefined;
	/**
	 * The host's own action on a row, for a host that does something else with
	 * a file than bring it into a chat, such as link it to a record. It is the
	 * row's button and leads its menu, in place of adding to context and
	 * saving. Undefined for a row it does not apply to, such as a folder.
	 */
	getItemAction?: (item: FileItem) => FileExplorerPrimaryAction | undefined;
	/** Open the account's sign in. Must be called inside the click. */
	onSignIn?: () => Promise<boolean>;
	/** Whether the host is showing the viewer. Defaults to true. */
	isVisible?: boolean;
	/** The host's `refreshRequestId`: the listing is read again when it changes. */
	refreshRequestId?: number;
	/**
	 * A line to show under a listing, such as that the drive stopped at its
	 * limit; see the explorer's `listingNote`.
	 */
	listingNote?: (items: FileItem[], path: string) => string | undefined;
}

/**
 * How old a listing has to be before coming back to it reads it again, so
 * that flicking between windows does not ask the drive each time.
 */
const STALE_AFTER_MS = 30_000;

/**
 * A connector's files in the file explorer the rest of SEMOSS browses files
 * with: the same tree, breadcrumbs, search, and refresh. The adapter supplies
 * the files; the rows add the connector's own actions, as every connector row
 * has them. The row's button adds a file to context, or saves it where the
 * host takes no context, and its right-click menu adds it to context, saves it
 * to the chat's files, or opens it in its own app. A host with an action of
 * its own (`getItemAction`) gets that as the button and first in the menu
 * instead, with the open entry after it. Selecting a file opens a
 * preview when the host supports it. A drive whose adapter creates also gets
 * the explorer's New button and its New File and New Folder menu entries,
 * which create in the drive. A signed out
 * account gets the same sign in prompt as every other viewer.
 *
 * A drive changes behind the viewer, which nothing tells it about, so the
 * listing is read again when the user comes back to it (to the window, or to
 * the viewer's tab) once it is half a minute old, and whenever the host says
 * the drive may have changed.
 */
export const ConnectorFileExplorer = ({
	adapter,
	serviceName,
	account = "microsoft",
	saver,
	getSaveRequest,
	getWebUrl,
	getItemAction,
	onSignIn,
	isVisible = true,
	refreshRequestId,
	listingNote,
}: ConnectorFileExplorerProps) => {
	const { t } = useTranslation("connectors");
	// what can be changed is the adapter's to say: a drive that creates gets
	// New, and every other drive stays browse only
	const explorer = useFileExplorer({
		mode: INSIGHT_MODE,
		adapter: adapter,
		onItemSelect: (item) => {
			const request = getSaveRequest(item);
			if (request) saver.open?.(request);
		},
	});

	// the commands keep one identity, so neither effect below runs again for a
	// render of the explorer
	const { commands } = explorer;
	const lastReadAtRef = useRef(Date.now());
	useEffect(() => {
		if (!isVisible) return;
		const readIfStale = () => {
			if (Date.now() - lastReadAtRef.current < STALE_AFTER_MS) return;
			lastReadAtRef.current = Date.now();
			commands.refresh();
		};
		// shown again after being hidden, which is also a coming back
		readIfStale();
		window.addEventListener("focus", readIfStale);
		return () => window.removeEventListener("focus", readIfStale);
	}, [isVisible, commands]);
	useEffect(() => {
		if (!refreshRequestId) return;
		lastReadAtRef.current = Date.now();
		commands.refresh();
	}, [refreshRequestId, commands]);

	const itemActions = (item: FileItem): FileExplorerItemActions => {
		const request = getSaveRequest(item);
		const webUrl = getWebUrl(item);
		const openIn = webUrl
			? {
					name: t("actions.openIn", { service: serviceName }),
					action: async () => {
						window.open(webUrl, "_blank", "noopener,noreferrer");
					},
				}
			: null;
		if (getItemAction) {
			const hostAction = getItemAction(item) ?? null;
			return {
				actions: [hostAction],
				secondaryActions: [
					hostAction && {
						name: hostAction.name,
						action: hostAction.action,
					},
					openIn,
				],
			};
		}
		const { addToContext } = saver;
		const icon =
			request && saver.isBusy(request.key) ? (
				<Spinner aria-hidden />
			) : addToContext ? (
				<MessageSquarePlusIcon aria-hidden />
			) : (
				<DownloadIcon aria-hidden />
			);
		return {
			actions: [
				request
					? {
							name: addToContext
								? t("actions.addNamedToContext", {
										name: item.name,
									})
								: saver.saveLabel,
							icon: icon,
							tooltip: addToContext
								? t("actions.addToContext")
								: saver.saveLabel,
							action: async () => {
								if (addToContext) {
									addToContext(request);
								} else {
									saver.save(request);
								}
							},
						}
					: null,
			],
			// the same menu every connector row has on a right-click
			secondaryActions: [
				request && addToContext
					? {
							name: t("actions.addToContext"),
							action: async () => {
								addToContext(request);
							},
						}
					: null,
				request
					? {
							name: saver.saveLabel,
							action: async () => {
								saver.save(request);
							},
						}
					: null,
				openIn,
			],
		};
	};

	return (
		<FileExplorer
			explorer={explorer}
			header={
				<FileExplorerHeader
					explorer={explorer}
					actions={
						<>
							<FileExplorerNewAction explorer={explorer} />
							<FileExplorerRefreshAction explorer={explorer} />
						</>
					}
				/>
			}
			newFileOverlay={NewFileOverlay}
			itemActions={itemActions}
			listingNote={listingNote}
			renderError={(error, retry) => {
				const info = classifyConnectorError(toConnectorError(error));
				return (
					<ConnectorViewerStatus
						query={{
							status:
								info.kind === "signIn" ? "signedOut" : "error",
							error: info,
							reload: retry,
						}}
						serviceName={serviceName}
						account={account}
						onSignIn={onSignIn}
					/>
				);
			}}
		/>
	);
};
