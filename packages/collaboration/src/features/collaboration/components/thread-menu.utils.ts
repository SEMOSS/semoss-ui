import { threadPath } from "@/lib/workspace-paths";

export type ThreadMenuArea = "work" | "brain";

/** Build a thread link without losing the deployment path or query string. */
export function threadUrl(
	threadId: string,
	currentUrl: string,
	area: ThreadMenuArea,
): string {
	const url = new URL(currentUrl);
	url.hash =
		area === "brain"
			? `/brain/threads/${encodeURIComponent(threadId)}`
			: threadPath(threadId);
	return url.href;
}

/** Return to a visible trigger, falling back to the surviving page landmark. */
export function restoreThreadFocus(trigger: HTMLElement | null): void {
	if (
		trigger?.isConnected &&
		!trigger.closest('[hidden], [inert], [aria-hidden="true"]')
	) {
		trigger.focus();
		if (document.activeElement === trigger) return;
	}
	document.querySelector<HTMLElement>("main[tabindex]")?.focus();
}
