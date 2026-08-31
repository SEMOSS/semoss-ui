import { Maximize2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ScrollArea,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
} from "@semoss/ui/next";

/** Title shown above the tab strip, shared by every tool card view. */
export const ToolCardHeader = ({ title }: { title: string }) => (
	<div className="shrink-0 px-4 pt-4 pb-2">
		<h2 className="font-semibold text-foreground text-xl">{title}</h2>
	</div>
);

/** The Description / Inputs / Output tab strip shared by every tool card view. */
export const ToolCardTabsList = () => {
	const { t } = useTranslation("tool");
	return (
		<TabsList className="mx-4 mb-2 shrink-0 self-start">
			<TabsTrigger value="description">
				{t("tabs.description")}
			</TabsTrigger>
			<TabsTrigger value="inputs">{t("tabs.inputs")}</TabsTrigger>
			<TabsTrigger value="output">{t("tabs.output")}</TabsTrigger>
		</TabsList>
	);
};

/**
 * Fills a bounded TabsContent panel with the app's styled scrollbar. `h-full`
 * on the inner column keeps flex children (e.g. a fill-height Textarea)
 * sized the way they were with plain `overflow-auto`. `px-3` on both sides
 * keeps the gap even on both ends, since the scrollbar renders inside it.
 */
export const ToolTabScrollArea = ({ children }: { children: ReactNode }) => (
	<ScrollArea className="h-full w-full">
		<div className="flex h-full flex-col space-y-2 px-3 pb-4">
			{children}
		</div>
	</ScrollArea>
);

/** Shared sizing for every tab panel; ScrollArea owns the scrolling. */
export const TOOL_CARD_TAB_CONTENT_CLASS =
	"flex min-h-0 flex-1 flex-col overflow-hidden px-1";

/** Description tab body: the tool's description, or a placeholder. */
export const ToolDescriptionTabContent = ({
	description,
}: {
	description?: string;
}) => {
	const { t } = useTranslation("tool");
	return (
		<TabsContent
			value="description"
			className={TOOL_CARD_TAB_CONTENT_CLASS}
		>
			<ToolTabScrollArea>
				{description ? (
					<p className="text-muted-foreground text-sm">
						{description}
					</p>
				) : (
					<p className="py-8 text-center text-muted-foreground text-sm">
						{t("form.noDescription")}
					</p>
				)}
			</ToolTabScrollArea>
		</TabsContent>
	);
};

/**
 * A read-only, monospace textarea for tool output with an "Expand" button
 * that opens the matching `ToolOutputDialog`.
 */
export const ToolOutputText = ({
	text,
	destructive,
	onExpand,
}: {
	text: string;
	destructive?: boolean;
	onExpand: () => void;
}) => {
	const { t } = useTranslation("tool");
	return (
		<>
			<div className="flex shrink-0 items-center justify-end">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-6 gap-1 px-2 text-muted-foreground text-xs"
					onClick={onExpand}
				>
					<Maximize2 className="size-3" />
					{t("actions.expand")}
				</Button>
			</div>
			<Textarea
				readOnly
				className={cn(
					"w-full flex-1 resize-none font-mono text-sm",
					destructive && "border-destructive text-destructive",
				)}
				value={text}
			/>
		</>
	);
};

/** Fullscreen read-only view of a tool's output, opened via the Expand button. */
export const ToolOutputDialog = ({
	title,
	text,
	open,
	onOpenChange,
}: {
	title: string;
	text: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) => {
	const { t } = useTranslation("tool");
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
				<DialogHeader>
					<DialogTitle>
						{t("form.outputDialogTitle", { title })}
					</DialogTitle>
				</DialogHeader>
				<ScrollArea className="min-h-0 flex-1 rounded-md bg-muted">
					<pre className="whitespace-pre-wrap p-4 font-mono text-sm">
						{text}
					</pre>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
};
