import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@semoss/ui/next";

export interface JsonViewerProps {
	value: unknown;
	depth?: number;
	name?: string;
	/** When true, this node renders expanded by default (first 2 levels). */
	initialOpen?: boolean;
	/** Bumped by Expand/Collapse-all controls so every node re-syncs. */
	forceVersion?: number;
	/** Desired open state when `forceVersion` increments. */
	forceOpen?: boolean;
}

/**
 * Recursive collapsible JSON tree. Designed to render the typical
 * pixel-execution result payloads (Python dicts / R lists / pixel
 * configs) with syntax-highlighted primitives and click-to-expand
 * objects/arrays.
 */
export const JsonViewer = ({
	value,
	depth = 0,
	name,
	initialOpen,
	forceVersion,
	forceOpen,
}: JsonViewerProps) => {
	const baseOpen = initialOpen ?? depth < 2; // first two levels expanded
	const [isOpen, setIsOpen] = useState(baseOpen);

	useEffect(() => {
		if (forceVersion === undefined || forceOpen === undefined) return;
		// Collapse-all keeps the root open so the user can still see the
		// top-level keys/items; only nested levels collapse.
		if (!forceOpen && depth === 0) {
			setIsOpen(true);
		} else {
			setIsOpen(forceOpen);
		}
	}, [forceVersion, forceOpen, depth]);

	if (value === null) return renderPrimitive(name, "null", "muted");
	if (value === undefined) return renderPrimitive(name, "undefined", "muted");
	if (typeof value === "string")
		return renderPrimitive(name, JSON.stringify(value), "string");
	if (typeof value === "number" || typeof value === "boolean")
		return renderPrimitive(name, String(value), "number");

	const isArray = Array.isArray(value);
	const entries = isArray
		? (value as unknown[]).map((v, i) => [String(i), v] as const)
		: Object.entries(value as Record<string, unknown>);
	const summary = isArray
		? `Array(${entries.length})`
		: `{ ${entries.length} ${entries.length === 1 ? "key" : "keys"} }`;
	const opener = isArray ? "[" : "{";
	const closer = isArray ? "]" : "}";

	return (
		<div className="min-w-0 font-mono text-xs leading-relaxed">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				aria-expanded={isOpen}
				aria-label={`${isOpen ? "Collapse" : "Expand"} ${name ?? (isArray ? "Array" : "Object")}`}
				className="h-auto min-h-6 max-w-full justify-start gap-1 whitespace-normal px-1 py-0.5 text-left font-mono text-xs"
				onClick={() => setIsOpen((v) => !v)}
			>
				{isOpen ? (
					<ChevronDownIcon
						aria-hidden="true"
						className="size-3 shrink-0 text-muted-foreground"
					/>
				) : (
					<ChevronRightIcon
						aria-hidden="true"
						className="size-3 shrink-0 text-muted-foreground"
					/>
				)}
				{name !== undefined && (
					<>
						<span className="min-w-0 break-words text-foreground">
							{JSON.stringify(name)}
						</span>
						<span className="text-muted-foreground">:</span>
					</>
				)}
				<span className="text-muted-foreground">
					{opener} {!isOpen && summary}
					{!isOpen && ` ${closer}`}
				</span>
			</Button>
			{isOpen && (
				<div className="ml-3 min-w-0 border-border border-l pl-2">
					{entries.map(([k, v]) => (
						<JsonViewer
							key={k}
							name={isArray ? undefined : k}
							value={v}
							depth={depth + 1}
							forceVersion={forceVersion}
							forceOpen={forceOpen}
						/>
					))}
					<div className="text-muted-foreground">{closer}</div>
				</div>
			)}
		</div>
	);
};

/** Renders JSON primitives as text; payload strings never become executable markup. */
const renderPrimitive = (
	name: string | undefined,
	text: string,
	tone: "string" | "number" | "muted",
) => {
	const color =
		tone === "string"
			? "text-destructive"
			: tone === "number"
				? "font-medium text-foreground"
				: "text-muted-foreground italic";
	return (
		<div className="min-w-0 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
			{name !== undefined && (
				<>
					<span className="font-medium text-foreground">
						{JSON.stringify(name)}
					</span>
					<span className="text-muted-foreground">: </span>
				</>
			)}
			<span className={color}>{text}</span>
		</div>
	);
};
