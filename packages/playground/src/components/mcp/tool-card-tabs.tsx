import { Maximize2 } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
} from "@semoss/ui/next";

/**
 * Title shown above the tab strip. Shared by every tool card view
 * (ToolsDefaultView, ToolsServerView) so the header stays visually
 * consistent regardless of which view renders the card.
 */
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

/** Description tab body: the tool's description, or a placeholder. */
export const ToolDescriptionTabContent = ({
	description,
}: {
	description?: string;
}) => {
	const { t } = useTranslation("tool");
	return (
		<TabsContent value="description" className="mx-4 overflow-auto pb-4">
			{description ? (
				<p className="text-muted-foreground text-sm">{description}</p>
			) : (
				<p className="py-8 text-center text-muted-foreground text-sm">
					{t("form.noDescription")}
				</p>
			)}
		</TabsContent>
	);
};

/**
 * Any TabsContent holding a Textarea uses mx-3 + px-1 instead of mx-4 —
 * split that way (rather than one mx-4) so the textarea's focus shadow has
 * room to render without getting clipped by the tab panel's edge.
 */
export const TOOL_CARD_TEXTAREA_TAB_CLASS =
	"mx-3 flex min-h-0 flex-1 flex-col space-y-2 overflow-auto px-1 pb-4";

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
				<pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm">
					{text}
				</pre>
			</DialogContent>
		</Dialog>
	);
};
