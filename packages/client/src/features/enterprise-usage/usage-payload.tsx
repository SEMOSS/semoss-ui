import { Copy, FoldVertical, UnfoldVertical } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { JsonViewer } from "@semoss/shared";
import { Button, H4, Muted, toast } from "@semoss/ui/next";
import type { UsageCell } from "./usage.types";

interface UsagePayloadProps {
	/** Section name shown above the retained content. */
	label: string;
	/** Raw retained data; null and undefined mean content was not retained. */
	value: UsageCell | undefined;
}

/** Matches activity-log inspection with a JSON tree, copy controls, and a plain-text fallback. */
export function UsagePayload({ label, value }: UsagePayloadProps) {
	const titleId = useId();
	const [expansion, setExpansion] = useState({
		isExpanded: false,
		version: 0,
	});
	const isRetained = value !== null && value !== undefined;
	const text = isRetained ? String(value) : "";
	const parsed = useMemo((): { isJson: boolean; data: unknown } => {
		try {
			return { isJson: true, data: JSON.parse(text) };
		} catch {
			return { isJson: false, data: null };
		}
	}, [text]);
	const hasNestedContent =
		parsed.data !== null &&
		typeof parsed.data === "object" &&
		Object.values(parsed.data).some(
			(child) =>
				child !== null &&
				typeof child === "object" &&
				Object.keys(child).length > 0,
		);
	const handleCopy = async (): Promise<void> => {
		try {
			// Preserve the recorded formatting and numeric precision when copying.
			await navigator.clipboard.writeText(text);
			toast.success(`${label} Copied`);
		} catch {
			toast.error("Unable To Copy Content. Check Clipboard Permissions.");
		}
	};
	return (
		<section aria-labelledby={titleId} className="min-w-0 space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<H4 id={titleId} className="text-sm">
					{label}
				</H4>
				{isRetained && (
					<div className="flex flex-wrap items-center gap-2">
						{hasNestedContent && (
							<Button
								type="button"
								size="sm"
								variant="outline"
								aria-label={`${expansion.isExpanded ? "Collapse" : "Expand"} All ${label} JSON Nodes`}
								onClick={() =>
									setExpansion((previous) => ({
										isExpanded: !previous.isExpanded,
										version: previous.version + 1,
									}))
								}
							>
								{expansion.isExpanded ? (
									<FoldVertical aria-hidden="true" />
								) : (
									<UnfoldVertical aria-hidden="true" />
								)}
								{expansion.isExpanded
									? "Collapse All"
									: "Expand All"}
							</Button>
						)}
						<Button
							type="button"
							size="sm"
							variant="outline"
							aria-label={`Copy ${label} ${parsed.isJson ? "JSON" : "Text"}`}
							onClick={handleCopy}
						>
							<Copy aria-hidden="true" />
							{parsed.isJson ? "Copy JSON" : "Copy Text"}
						</Button>
					</div>
				)}
			</div>
			<section
				aria-label={`${label} Content`}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: Retained content can scroll and must be reachable by keyboard.
				tabIndex={0}
				className="max-h-96 min-w-0 overflow-auto rounded-md border bg-muted/30 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				{!isRetained ? (
					<Muted>Content Was Not Retained.</Muted>
				) : parsed.isJson ? (
					<JsonViewer
						value={parsed.data}
						forceOpen={expansion.isExpanded}
						forceVersion={expansion.version || undefined}
					/>
				) : text === "" ? (
					<Muted>Empty Content Was Recorded.</Muted>
				) : (
					<pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
						{text}
					</pre>
				)}
			</section>
		</section>
	);
}
