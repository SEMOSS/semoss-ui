import { lazy } from "react";
import type { ToolViewLibrary } from "@semoss/shared";

/**
 * The mail views a tool can name as `component://mail/<view>`, each loaded
 * when first shown. Every mailbox shares them; the URI's `provider` says
 * which one a call reads.
 *
 * - `list`: the emails `ListMail` found.
 * - `message`: the email `GetMail` read, or a move or delete to approve
 *   (`intent=move`, `intent=delete`).
 * - `compose`: an email to send or save to approve, editable, then what was
 *   sent or saved (`intent` of `send`, `draft`, `reply`, `forward`).
 */
export const MAIL_TOOL_VIEWS: ToolViewLibrary = {
	list: lazy(() =>
		import("./mail-list-tool-view").then((module) => ({
			default: module.MailListToolView,
		})),
	),
	message: lazy(() =>
		import("./mail-message-tool-view").then((module) => ({
			default: module.MailMessageToolView,
		})),
	),
	compose: lazy(() =>
		import("./mail-compose-tool-view").then((module) => ({
			default: module.MailComposeToolView,
		})),
	),
};
