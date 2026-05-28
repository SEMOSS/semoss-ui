import {
	ChevronDown,
	ChevronRight,
	ChevronsDownUp,
	ChevronsUpDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface JsonValueViewerProps {
	value: unknown;
	/**
	 * Controlled expand-all state. When provided, the viewer uses this value
	 * instead of its internal state and the caller is responsible for toggling
	 * via its own UI (typically combined with `hideToggle`).
	 */
	expandAll?: boolean;
	/** Hide the built-in absolute-positioned expand-all toggle. */
	hideToggle?: boolean;
	/**
	 * Reserve a stable height equal to the fully-expanded layout so the viewer
	 * doesn't grow/shrink as sections are toggled. Caps at 60vh and scrolls
	 * beyond. When false (default), the viewer grows with its current content
	 * and relies on the parent container for overflow.
	 */
	fixedHeight?: boolean;
}

interface JsonTreeNodeProps {
	value: unknown;
	isChild?: boolean;
	expandAll?: boolean;
	parentRefs: object[];
}

const isObjectValue = (
	value: unknown,
): value is Record<string, unknown> | unknown[] => {
	return value !== null && typeof value === "object";
};

const renderPrimitive = (value: unknown) => {
	if (value === null) return <span className="text-blue-500">null</span>;
	if (typeof value === "string")
		return <span className="text-destructive">"{value}"</span>;
	if (typeof value === "number")
		return <span className="text-green-600">{value}</span>;
	if (typeof value === "boolean")
		return <span className="text-blue-500">{value.toString()}</span>;
	return <span className="text-muted-foreground">{`${value}`}</span>;
};

const JsonTreeNode = ({
	value,
	isChild = false,
	expandAll,
	parentRefs,
}: JsonTreeNodeProps) => {
	const hasChildren = isObjectValue(value);
	const isCircular = hasChildren && parentRefs.includes(value);
	const [isExpanded, setIsExpanded] = useState(
		!isChild || expandAll === true,
	);

	useEffect(() => {
		if (expandAll !== undefined && hasChildren && isChild) {
			setIsExpanded(expandAll);
		}
	}, [expandAll, hasChildren, isChild]);

	if (!hasChildren) {
		return <span>{renderPrimitive(value)}</span>;
	}

	if (isCircular) {
		return <span className="text-muted-foreground">"[Circular]"</span>;
	}

	const isArray = Array.isArray(value);
	const entries = Object.entries(value);
	const isEmpty = entries.length === 0;
	const nextParentRefs = [...parentRefs, value];

	if (isEmpty) {
		return <span className="text-primary">{isArray ? "[]" : "{}"}</span>;
	}

	return (
		<div className={isChild ? "ml-3" : "ml-0"}>
			<div className="flex items-center">
				{isChild && (
					<button
						type="button"
						aria-label={
							isExpanded
								? "Collapse JSON node"
								: "Expand JSON node"
						}
						className="mr-1 inline-flex items-center rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground [&>svg]:size-4"
						onClick={() => setIsExpanded((previous) => !previous)}
					>
						{isExpanded ? <ChevronDown /> : <ChevronRight />}
					</button>
				)}
				<span className="text-primary">{isArray ? "[" : "{"}</span>
				{isChild && !isExpanded && (
					<span className="text-primary">
						{isArray ? "...]" : "...}"}
					</span>
				)}
			</div>
			{isExpanded && (
				<div className={isChild ? "" : "ml-4"}>
					{entries.map(([entryKey, entryValue]) => (
						<div
							key={entryKey}
							className={isChild ? "ml-4" : "ml-0"}
						>
							{isArray ? (
								<>
									<span className="text-muted-foreground">
										{entryKey}
									</span>
									:{" "}
								</>
							) : (
								<>
									<span className="text-primary">
										"{entryKey}"
									</span>
									:{" "}
								</>
							)}
							<JsonTreeNode
								value={entryValue}
								isChild
								expandAll={expandAll}
								parentRefs={nextParentRefs}
							/>
						</div>
					))}
				</div>
			)}
			{isExpanded && (
				<div className="text-primary">{isArray ? "]" : "}"}</div>
			)}
		</div>
	);
};

const hasNestedObject = (value: unknown): boolean => {
	if (!isObjectValue(value)) return false;
	return Object.values(value).some(isObjectValue);
};

// Matches the viewer's `text-[13px] leading-[1.4]` rendering.
export const JSON_VIEWER_LINE_HEIGHT_PX = 18.2;
const LINE_HEIGHT_PX = JSON_VIEWER_LINE_HEIGHT_PX;

export const countExpandedJsonLines = (
	value: unknown,
	seen: Set<object> = new Set(),
): number => {
	if (!isObjectValue(value)) return 1;
	if (seen.has(value)) return 1;
	const entries = Object.entries(value);
	if (entries.length === 0) return 1;
	const nextSeen = new Set(seen);
	nextSeen.add(value);
	let total = 2;
	for (const [, child] of entries) {
		if (isObjectValue(child) && Object.entries(child).length > 0) {
			total += 1 + countExpandedJsonLines(child, nextSeen);
		} else {
			total += 1;
		}
	}
	return total;
};

export const JsonValueViewer = ({
	value,
	expandAll: controlledExpandAll,
	hideToggle,
	fixedHeight,
}: JsonValueViewerProps) => {
	const [internalExpandAll, setInternalExpandAll] = useState<
		boolean | undefined
	>(undefined);
	const isControlled = controlledExpandAll !== undefined;
	const expandAll = isControlled ? controlledExpandAll : internalExpandAll;
	const setExpandAll = setInternalExpandAll;
	const showToggle = useMemo(() => hasNestedObject(value), [value]);
	const renderToggle = showToggle && !hideToggle && !isControlled;
	const expandedHeightPx = useMemo(
		() => Math.ceil(countExpandedJsonLines(value) * LINE_HEIGHT_PX),
		[value],
	);

	if (value === null || typeof value === "undefined") {
		return (
			<span className="text-muted-foreground text-xs">{`${value}`}</span>
		);
	}

	if (typeof value !== "object") {
		return <span className="text-xs">{renderPrimitive(value)}</span>;
	}

	return (
		<div className="relative">
			{renderToggle && (
				<button
					type="button"
					aria-label={
						expandAll
							? "Collapse all JSON nodes"
							: "Expand all JSON nodes"
					}
					title={expandAll ? "Collapse all" : "Expand all"}
					className="absolute top-0 right-0 z-10 inline-flex items-center rounded-sm bg-background/80 p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
					onClick={() => setExpandAll((v) => !v)}
				>
					{expandAll ? (
						<ChevronsDownUp className="size-3" />
					) : (
						<ChevronsUpDown className="size-3" />
					)}
				</button>
			)}
			<div
				className="overflow-auto font-mono text-[13px] text-foreground leading-[1.4]"
				style={
					fixedHeight
						? { height: `min(60vh, ${expandedHeightPx}px)` }
						: undefined
				}
			>
				<JsonTreeNode
					value={value}
					parentRefs={[]}
					expandAll={expandAll}
				/>
			</div>
		</div>
	);
};
