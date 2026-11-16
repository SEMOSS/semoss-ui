import type { CSSProperties } from "react";
import { Small } from "@semoss/ui/next";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";

/** The owner's draft font and the signature the server adds on save; plain defaults outside the app. */
export function useDraftLook(): {
	style: CSSProperties;
	font: string;
	size: number;
	signatureHtml: string;
} {
	const session = useOptionalCollaborationSession();
	const settings = session?.state.settings;
	const font = settings?.draftFont || "Aptos";
	const size = settings?.draftFontSize ?? 12;
	return {
		font,
		size,
		style: {
			fontFamily: `${font}, Calibri, Helvetica, sans-serif`,
			fontSize: `${size}pt`,
		},
		signatureHtml:
			settings?.draftSignatureOn !== false
				? (settings?.draftSignatureHtml ?? "")
				: "",
	};
}

/** Signature HTML from mail, drawn sandboxed so it never runs in the app. */
export function SignatureFrame({
	html,
	font,
	size,
	className,
}: {
	html: string;
	font: string;
	size: number;
	className?: string;
}) {
	return (
		<iframe
			title="Your signature"
			sandbox=""
			className={className}
			srcDoc={`<body style="margin:12px;font-family:${font},Calibri,sans-serif;font-size:${size}pt">${html}</body>`}
		/>
	);
}

/** What Outlook gets below the body: shown read-only, added by the server when the draft is saved. */
export function DraftSignaturePreview() {
	const { font, size, signatureHtml } = useDraftLook();
	if (!signatureHtml) return null;
	return (
		<div className="shrink-0 space-y-1 px-4 pb-2">
			<Small className="text-muted-foreground">
				Your signature is added when the draft is saved. Change it in
				Settings &gt; Email.
			</Small>
			<SignatureFrame
				html={signatureHtml}
				font={font}
				size={size}
				className="h-28 w-full rounded-md border bg-white"
			/>
		</div>
	);
}
