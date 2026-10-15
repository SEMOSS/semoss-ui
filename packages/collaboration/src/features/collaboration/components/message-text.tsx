import { P } from "@semoss/ui/next";
import { linkLabel, textParts } from "../message-text";

// plain text; only http(s) links become anchors
export function MessageText({ text }: { text: string }) {
	return (
		<P className="whitespace-pre-wrap break-words leading-relaxed">
			{textParts(text).map((part, index) =>
				part.kind === "link" ? (
					<a
						// biome-ignore lint/suspicious/noArrayIndexKey: parts are positional and never reorder
						key={index}
						href={part.href}
						target="_blank"
						rel="noreferrer"
						title={part.href}
						className="break-all text-primary underline underline-offset-2"
					>
						{linkLabel(part.href)}
					</a>
				) : (
					part.text
				),
			)}
		</P>
	);
}
