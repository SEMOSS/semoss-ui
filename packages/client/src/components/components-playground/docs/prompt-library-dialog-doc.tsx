import { useState } from "react";
import {
	PromptLibraryDialog,
	type PromptLibraryItem,
} from "@semoss/chat/components";
import { Button } from "@semoss/ui/next";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { SAMPLE_PROMPTS } from "../fixtures";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{
		name: "open",
		type: "boolean",
		required: true,
		description: "",
	},
	{
		name: "onOpenChange",
		type: "(open: boolean) => void",
		required: true,
		description: "",
	},
	{
		name: "prompts",
		type: "PromptLibraryItem[]",
		required: true,
		description:
			"Pure-props, like RoomSidebar/EngineSelect — the host fetches its own prompts and passes them in.",
	},
	{
		name: "isLoading",
		type: "boolean",
		description:
			"Shows a disabled/loading state while the host is still fetching prompts.",
	},
	{
		name: "onSelectPrompt",
		type: "(prompt: PromptLibraryItem) => void",
		required: true,
		description: "Fired when a prompt is chosen; the dialog closes itself.",
	},
];

export const PromptLibraryDialogDoc = () => {
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<PromptLibraryItem | null>(null);

	return (
		<DocPage
			title="PromptLibraryDialog"
			description="A searchable, tag-filterable grid of reusable prompts, grouped by tag — a multi-tag prompt appears once per tag group it belongs to. Prompt data is entirely host-supplied; the component fetches nothing itself."
		>
			<DemoSection
				preview={
					<div className="flex flex-col items-start gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setOpen(true)}
						>
							Open prompt library
						</Button>
						{selected ? (
							<p className="text-muted-foreground text-sm">
								→ selected: {selected.title}
							</p>
						) : null}
						<PromptLibraryDialog
							open={open}
							onOpenChange={setOpen}
							prompts={SAMPLE_PROMPTS}
							onSelectPrompt={setSelected}
						/>
					</div>
				}
				code={`import { PromptLibraryDialog } from "@semoss/chat/components";

<PromptLibraryDialog
  open={open}
  onOpenChange={setOpen}
  prompts={prompts}
  onSelectPrompt={(prompt) => setInput(prompt.context)}
/>`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
