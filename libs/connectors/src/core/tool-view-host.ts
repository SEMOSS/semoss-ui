import type { ToolViewHost } from "@semoss/shared";
import type { ConnectorViewerProps } from "./connector.types";

/**
 * What a tool view's host offers, in the form the viewers take it. A saved
 * item's viewer service becomes the file's `source`, so the host can show
 * the app's logo.
 *
 * @param host - What the tool view's host offers.
 * @return The viewer host props.
 */
export const toViewerHost = (host: ToolViewHost): ConnectorViewerProps => {
	const { saveTargetName, onSaved, onAddToContext, onSignIn } = host;
	return {
		saveTargetName: saveTargetName,
		onSignIn: onSignIn,
		onSaved: onSaved
			? (file) =>
					onSaved({
						path: file.path,
						name: file.name,
						source: file.service,
					})
			: undefined,
		onAddToContext: onAddToContext
			? (file) =>
					onAddToContext({
						path: file.path,
						name: file.name,
						source: file.service,
					})
			: undefined,
	};
};
