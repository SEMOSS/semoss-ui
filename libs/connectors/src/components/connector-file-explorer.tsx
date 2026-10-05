import { DownloadIcon, MessageSquarePlusIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	FileExplorer,
	type FileExplorerAdapter,
	FileExplorerHeader,
	type FileExplorerItemActions,
	FileExplorerRefreshAction,
	type FileItem,
	type FileMode,
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
export interface ConnectorFileExplorerProps {
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
	/** Open the account's sign in. Must be called inside the click. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * A connector's files in the file explorer the rest of SEMOSS browses files
 * with: the same tree, breadcrumbs, search, and refresh. The adapter supplies
 * the files; the rows add the connector's own actions, as every connector row
 * has them. The row's button adds a file to context, or saves it where the
 * host takes no context, and its right-click menu adds it to context, saves it
 * to the chat's files, or opens it in its own app. A signed out
 * account gets the same sign in prompt as every other viewer.
 */
export const ConnectorFileExplorer = ({
	adapter,
	serviceName,
	account = "microsoft",
	saver,
	getSaveRequest,
	getWebUrl,
	onSignIn,
}: ConnectorFileExplorerProps) => {
	const { t } = useTranslation("connectors");
	const explorer = useFileExplorer({
		mode: INSIGHT_MODE,
		adapter: adapter,
		readOnly: true,
	});

	const itemActions = (item: FileItem): FileExplorerItemActions => {
		const request = getSaveRequest(item);
		const webUrl = getWebUrl(item);
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
				webUrl
					? {
							name: t("actions.openIn", { service: serviceName }),
							action: async () => {
								window.open(
									webUrl,
									"_blank",
									"noopener,noreferrer",
								);
							},
						}
					: null,
			],
		};
	};

	return (
		<FileExplorer
			explorer={explorer}
			header={
				<FileExplorerHeader
					explorer={explorer}
					actions={<FileExplorerRefreshAction explorer={explorer} />}
				/>
			}
			newFileOverlay={null}
			itemActions={itemActions}
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
