import { BlocksIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { type MCPConfig, MCPSelector } from "@semoss/shared";
import {
	Badge,
	Button,
	H4,
	Muted,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	useIsMobile,
} from "@semoss/ui/next";
import { isKnowledgeMcp } from "@/utility/mcp-utils";

interface RoomToolsPickerProps {
	/** Full room configuration, including inherited tools. */
	values: MCPConfig[];
	/** Changes apply to the next message through the existing room options. */
	onChange: (values: MCPConfig[]) => void;
	/** Running turns keep configuration readable but immutable. */
	disabled: boolean;
	/** Whether system toolboxes are available in this deployment. */
	showSystemTools?: boolean;
	/** Existing knowledge catalog filtering flag. */
	enableKnowledgeMCP?: boolean;
}

/** Small conversation-scoped picker, with a sheet for touch layouts. */
export function RoomToolsPicker({
	values,
	onChange,
	disabled,
	showSystemTools,
	enableKnowledgeMCP,
}: RoomToolsPickerProps) {
	const { t } = useTranslation("room");
	const [isOpen, setIsOpen] = useState(false);
	const isMobile = useIsMobile();
	const tools = values.filter((item) => !isKnowledgeMcp(item));
	const knowledge = values.filter(isKnowledgeMcp);
	const trigger = (
		<Button
			variant="ghost"
			size="sm"
			className="gap-2 rounded-full"
			aria-label={t("studio.toolsCount", { count: values.length })}
		>
			<BlocksIcon aria-hidden="true" />
			<span>{t("studio.tools")}</span>
			{values.length > 0 && (
				<Badge variant="secondary">{values.length}</Badge>
			)}
		</Button>
	);
	const content = (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			<Muted className="text-sm">
				{t(disabled ? "studio.toolsLocked" : "studio.toolsHint")}
			</Muted>
			<Tabs defaultValue="tools" className="min-h-0 flex-1">
				<TabsList className="w-full">
					<TabsTrigger value="tools">
						{t("studio.tools")} ({tools.length})
					</TabsTrigger>
					<TabsTrigger value="knowledge">
						{t("form.knowledgeLabel")} ({knowledge.length})
					</TabsTrigger>
				</TabsList>
				<TabsContent value="tools" className="min-h-0">
					<MCPSelector
						type="TOOLBOX"
						presentation="list"
						values={tools}
						disabled={disabled}
						showSystemTools={showSystemTools}
						onChange={(next) => {
							if (!disabled) onChange([...knowledge, ...next]);
						}}
					/>
				</TabsContent>
				<TabsContent value="knowledge" className="min-h-0">
					<MCPSelector
						type="KNOWLEDGE"
						presentation="list"
						values={knowledge}
						disabled={disabled}
						enableKnowledgeMCP={enableKnowledgeMCP}
						onChange={(next) => {
							if (!disabled) onChange([...tools, ...next]);
						}}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
	return isMobile ? (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>{trigger}</SheetTrigger>
			<SheetContent
				side="bottom"
				className="flex h-3/4 flex-col gap-4 rounded-t-xl p-4"
			>
				<SheetHeader>
					<SheetTitle>{t("studio.toolsTitle")}</SheetTitle>
					<SheetDescription>
						{t("studio.toolsDescription")}
					</SheetDescription>
				</SheetHeader>
				{content}
			</SheetContent>
		</Sheet>
	) : (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent
				side="top"
				align="start"
				className="flex h-112 w-96 max-w-full flex-col gap-3 p-4"
				style={{
					maxHeight: "var(--radix-popover-content-available-height)",
				}}
			>
				<H4 className="text-base">{t("studio.toolsTitle")}</H4>
				{content}
			</PopoverContent>
		</Popover>
	);
}
