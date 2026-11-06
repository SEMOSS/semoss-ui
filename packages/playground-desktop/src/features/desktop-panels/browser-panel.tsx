import { type FormEvent, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, Input, Small } from "@semoss/ui/next";
import { useWorkbenchPanel, type WorkbenchPanelProps } from "@semoss/workbench";

/** What a browser panel is opened with. */
export interface BrowserPanelConfig {
	/** The page it shows; none until the user enters one. */
	url?: string;
}

/**
 * Turn what the user typed into a web address, or null for anything that is
 * not one: only http and https pages are shown.
 *
 * @param input - The address bar's text.
 * @returns The address, or null.
 */
export const toBrowserUrl = (input: string): string | null => {
	const text = input.trim();
	if (!text) {
		return null;
	}
	try {
		const url = new URL(/^[a-z]+:/i.test(text) ? text : `https://${text}`);
		return url.protocol === "http:" || url.protocol === "https:"
			? url.href
			: null;
	} catch {
		return null;
	}
};

/**
 * A web page in the room's Workspace: an address bar over the page in a
 * frame. Its address is the panel's config, so it is the room's alone and
 * comes back as it was when the Workspace closes and reopens. Sites that
 * refuse to be framed (`X-Frame-Options`, `frame-ancestors`) do not show.
 *
 * @component
 */
export const BrowserPanel = ({ id }: WorkbenchPanelProps) => {
	const { t } = useTranslation("desktop");
	const { config, setConfig } = useWorkbenchPanel<BrowserPanelConfig>(id);
	const [address, setAddress] = useState(config.url ?? "");

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const url = toBrowserUrl(address);
		if (url) {
			setAddress(url);
			setConfig({ url: url });
		}
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<form
				className="flex shrink-0 items-center gap-2 border-border border-b p-2"
				onSubmit={handleSubmit}
			>
				<Input
					aria-label={t("browser.address")}
					value={address}
					onChange={(event) => setAddress(event.target.value)}
					placeholder="https://"
					className="h-8"
				/>
				<Button type="submit" size="sm">
					{t("browser.go")}
				</Button>
			</form>
			{config.url ? (
				<iframe
					key={config.url}
					title={config.url}
					src={config.url}
					// no access to the app: its own origin, scripts and forms only
					sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
					referrerPolicy="no-referrer"
					className="min-h-0 w-full flex-1 border-0 bg-background"
				/>
			) : (
				<Small className="p-4 text-muted-foreground">
					{t("browser.blocked")}
				</Small>
			)}
		</div>
	);
};
