import type { RibbonActionInput } from "docx-react-viewer";

/**
 * Keep formatting, tables, layout and insertion in the native ribbon, which
 * preserves active header/footer/note targets. This API hides only ribbon UI;
 * title actions, File and context menus still need upstream customization hooks.
 */
export const DOCX_HIDDEN_ACTIONS = [
	"document-themes",
	"document-colors",
	"document-fonts",
	"document-paragraph-spacing",
	"document-effects",
	"set-default-formatting",
	"envelopes",
	"labels",
	"start-mail-merge",
	"select-recipients",
	"edit-recipient-list",
	"highlight-merge-fields",
	"address-block",
	"greeting-line",
	"insert-merge-field",
	"merge-rules",
	"match-fields",
	"update-labels",
	"preview-results",
	"find-recipient",
	"check-merge-errors",
	"finish-merge",
	"track-changes",
	"tracking-options",
	"display-for-review",
	"previous-change",
	"next-change",
	"accept",
	"reject",
	"accept-all",
	"reject-all",
	"add-comment",
	"comments",
	"delete-comment",
	"previous-comment",
	"next-comment",
	"help",
	"print",
] as const satisfies readonly RibbonActionInput[];
