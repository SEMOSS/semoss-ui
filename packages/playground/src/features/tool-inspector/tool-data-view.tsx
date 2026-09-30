import { type ReactNode, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { formatToolPayload } from "./tool-payload";
import { ToolPayloadEditor } from "./tool-payload-editor";
import { ToolPayloadToolbar } from "./tool-payload-toolbar";

interface ToolDataViewProps {
	value: unknown;
	label: string;
	/** Tool results can contain either serialized JSON or plain text. */
	parseResponse?: boolean;
	/** When provided, start with readable fields and offer the raw JSON. */
	prettyContent?: ReactNode;
}

/** The same complete payload in the panel and its expanded dialog. */
export const ToolDataView = ({
	value,
	label,
	parseResponse = false,
	prettyContent,
}: ToolDataViewProps) => {
	const { t, i18n } = useTranslation("tool");
	const [expanded, setExpanded] = useState(false);
	const [view, setView] = useState("pretty");
	const [hasViewedRaw, setHasViewedRaw] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const payload = useMemo(
		() => formatToolPayload(value, parseResponse),
		[value, parseResponse],
	);
	const viewSelector = prettyContent ? (
		<ToggleGroup
			type="single"
			value={view}
			onValueChange={(value) => {
				if (value) setView(value);
				if (value === "raw") setHasViewedRaw(true);
			}}
			dir={i18n.dir()}
			size="sm"
			aria-label={t("inspector.inputView")}
		>
			<ToggleGroupItem value="pretty" className="px-2 text-xs">
				{t("inspector.pretty")}
			</ToggleGroupItem>
			<ToggleGroupItem value="raw" className="px-2 text-xs">
				{t("inspector.raw")}
			</ToggleGroupItem>
		</ToggleGroup>
	) : undefined;
	const renderPayload = (onExpand?: (trigger: HTMLButtonElement) => void) => (
		<>
			{prettyContent && (
				<div
					className="h-full"
					hidden={view !== "pretty"}
					data-payload-view="pretty"
				>
					<div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-background">
						<ToolPayloadToolbar
							text={payload.text}
							onExpand={onExpand}
						>
							{viewSelector}
						</ToolPayloadToolbar>
						<section
							className="min-h-0 flex-1 overflow-auto"
							aria-label={label}
							// biome-ignore lint/a11y/noNoninteractiveTabindex: Enable keyboard scrolling in browsers that do not focus scroll containers automatically.
							tabIndex={0}
						>
							{prettyContent}
						</section>
					</div>
				</div>
			)}
			{(!prettyContent || hasViewedRaw) && (
				<div
					className="h-full"
					hidden={!!prettyContent && view !== "raw"}
					data-payload-view="raw"
				>
					<ToolPayloadEditor
						{...payload}
						label={label}
						toolbarStart={viewSelector}
						onExpand={onExpand}
					/>
				</div>
			)}
		</>
	);

	return (
		<>
			<div ref={containerRef} className="h-full min-h-0">
				{renderPayload(() => setExpanded(true))}
			</div>
			<Dialog open={expanded} onOpenChange={setExpanded}>
				<DialogContent
					className="h-[85dvh] min-h-0 gap-3 overflow-hidden p-4 [scrollbar-gutter:auto] sm:max-w-[min(80rem,calc(100%-4rem))]"
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						containerRef.current
							?.querySelector<HTMLButtonElement>(
								`[data-payload-view="${prettyContent ? view : "raw"}"] [data-tool-expand]`,
							)
							?.focus();
					}}
				>
					<DialogHeader className="shrink-0 pe-8 text-start">
						<DialogTitle
							className="truncate leading-normal"
							title={label}
						>
							{label}
						</DialogTitle>
						<DialogDescription className="sr-only">
							{t("inspector.expandedDescription")}
						</DialogDescription>
					</DialogHeader>
					<div className="min-h-0 flex-1">{renderPayload()}</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
