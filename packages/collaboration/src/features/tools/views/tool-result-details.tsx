import { ExternalLink } from "lucide-react";
import { Button, Muted, P } from "@semoss/ui/next";
import {
	resultRecord,
	resultText,
	resultWebLink,
	toolFieldLabel,
} from "./tool-result-data";

interface ToolResultDetailsProps {
	/** Structured data stays readable, including nested people and attachments. */
	value: unknown;
	depth?: number;
}

/** Render result fields as labelled content, without interpreting source HTML. */
export function ToolResultDetails({
	value,
	depth = 0,
}: ToolResultDetailsProps) {
	const record = resultRecord(value);
	if (value === null || value === undefined)
		return <Muted className="text-sm">Not provided</Muted>;
	if (depth > 8)
		return (
			<P className="whitespace-pre-wrap break-words text-sm">
				{JSON.stringify(value)}
			</P>
		);
	if (Array.isArray(value)) {
		if (!value.length) return <Muted className="text-sm">None</Muted>;
		if (value.every((item) => !resultRecord(item) && !Array.isArray(item)))
			return (
				<P className="whitespace-pre-wrap break-words text-sm">
					{value.map(resultText).join(", ")}
				</P>
			);
		return (
			<ul className="min-w-0 space-y-3">
				{value.map((item, index) => (
					<li
						// biome-ignore lint/suspicious/noArrayIndexKey: Read-only fields retain the order in this immutable call result.
						key={index}
						className="min-w-0 border-border border-b pb-3 last:border-0 last:pb-0"
					>
						<ToolResultDetails value={item} depth={depth + 1} />
					</li>
				))}
			</ul>
		);
	}
	if (!record)
		return (
			<P className="whitespace-pre-wrap break-words text-sm">
				{resultText(value)}
			</P>
		);
	const fields = Object.entries(record).filter(
		([, field]) => field !== undefined && field !== null && field !== "",
	);
	if (!fields.length)
		return <Muted className="text-sm">No additional details.</Muted>;
	return (
		<dl className="grid min-w-0 gap-3">
			{fields.map(([key, field]) => {
				const url = ["webUrl", "webLink", "url", "link"].includes(key)
					? resultWebLink(field)
					: undefined;
				return (
					<div key={key} className="min-w-0">
						<dt className="mb-1 text-muted-foreground text-xs">
							{toolFieldLabel(key)}
						</dt>
						<dd className="min-w-0">
							{url ? (
								<Button
									asChild
									variant="link"
									size="sm"
									className="h-auto max-w-full justify-start whitespace-normal p-0 text-start"
								>
									<a
										href={url}
										target="_blank"
										rel="noopener noreferrer"
									>
										Open in source{" "}
										<ExternalLink
											aria-hidden="true"
											className="size-3.5 shrink-0"
										/>
									</a>
								</Button>
							) : (
								<ToolResultDetails
									value={field}
									depth={depth + 1}
								/>
							)}
						</dd>
					</div>
				);
			})}
		</dl>
	);
}
