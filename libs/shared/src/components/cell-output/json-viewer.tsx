import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";

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
		// top-level keys/items — only nested levels collapse.
		if (!forceOpen && depth === 0) {
			setIsOpen(true);
		} else {
			setIsOpen(forceOpen);
		}
	}, [forceVersion, forceOpen, depth]);

	if (value === null)
		return <Primitive name={name} text="null" tone="muted" />;
	if (value === undefined)
		return <Primitive name={name} text="undefined" tone="muted" />;
	if (typeof value === "string")
		return <Primitive name={name} text={`"${value}"`} tone="string" />;
	if (typeof value === "number" || typeof value === "boolean")
		return <Primitive name={name} text={String(value)} tone="number" />;

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
		<div className="font-mono text-[12px] leading-snug">
			<button
				type="button"
				className="inline-flex items-center gap-1 rounded px-0.5 text-left text-foreground hover:bg-muted"
				onClick={() => setIsOpen((v) => !v)}
			>
				{isOpen ? (
					<ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
				) : (
					<ChevronRightIcon className="h-3 w-3 text-muted-foreground" />
				)}
				{name !== undefined && (
					<>
						<span className="text-purple-700 dark:text-purple-300">
							{name}
						</span>
						<span className="text-muted-foreground">:</span>
					</>
				)}
				<span className="text-muted-foreground">
					{opener} {!isOpen && summary}
					{!isOpen && ` ${closer}`}
				</span>
			</button>
			{isOpen && (
				<div className="ml-3 border-border border-l pl-2">
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

const Primitive = ({
	name,
	text,
	tone,
}: {
	name?: string;
	text: string;
	tone: "string" | "number" | "muted";
}) => {
	const color =
		tone === "string"
			? "text-emerald-700 dark:text-emerald-300"
			: tone === "number"
				? "text-blue-700 dark:text-blue-300"
				: "text-muted-foreground italic";
	return (
		<div className="font-mono text-[12px] leading-snug">
			{name !== undefined && (
				<>
					<span className="text-purple-700 dark:text-purple-300">
						{name}
					</span>
					<span className="text-muted-foreground">: </span>
				</>
			)}
			<span className={color}>{text}</span>
		</div>
	);
};
