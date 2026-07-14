import { useState } from "react";
import { ChatInput } from "@semoss/chat/components";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{
		name: "onSend",
		type: "(text: string) => void",
		required: true,
		description: "Enter sends, Shift+Enter inserts a newline.",
	},
	{ name: "disabled", type: "boolean", description: "" },
	{
		name: "isGenerating",
		type: "boolean",
		description: "Swaps the Send icon for a Spinner.",
	},
	{
		name: "enableVoiceInput",
		type: "boolean",
		default: "false",
		description: "Adds a Web Speech API mic button.",
	},
	{
		name: "value",
		type: "string",
		description:
			"Controlled mode — omit to use ChatInput's own internal state.",
	},
	{
		name: "onValueChange",
		type: "(value: string) => void",
		description: "Required alongside value for controlled mode.",
	},
	{ name: "placeholder", type: "string", description: "" },
	{ name: "className", type: "string", description: "" },
	{
		name: "trailingActions",
		type: "ReactNode",
		description: "Slot rendered before the Send button.",
	},
];

export const ChatInputDoc = () => {
	const [isGenerating, setIsGenerating] = useState(false);
	const [sent, setSent] = useState<string[]>([]);

	return (
		<DocPage
			title="ChatInput"
			description="The composer textarea. Enter sends, Shift+Enter inserts a newline. isGenerating swaps Send for a Spinner. EngineSelect/McpMenuButton/MCPOverlay are no longer suggested compositions here — the simplified direction is slash commands inside the composer instead (see #3394)."
		>
			<DemoSection
				preview={
					<div className="flex flex-col gap-2">
						<ChatInput
							onSend={(text) =>
								setSent((prev) => [...prev, text])
							}
							isGenerating={isGenerating}
							enableVoiceInput
						/>
						<button
							type="button"
							className="self-start text-muted-foreground text-xs underline"
							onClick={() => setIsGenerating((v) => !v)}
						>
							{isGenerating
								? "stop generating"
								: "simulate generating"}
						</button>
						{sent.length > 0 ? (
							<ul className="flex flex-col gap-1 text-muted-foreground text-sm">
								{sent.map((text, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: append-only demo log
									<li key={i}>→ {text}</li>
								))}
							</ul>
						) : null}
					</div>
				}
				code={`import { ChatInput } from "@semoss/chat/components";

const { isTyping, sendMessage } = useChat({ engineId, roomId });

<ChatInput
  onSend={sendMessage}
  isGenerating={isTyping}
  enableVoiceInput
/>`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
