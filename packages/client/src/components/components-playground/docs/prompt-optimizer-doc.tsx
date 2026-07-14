import { useState } from "react";
import { PromptOptimizer } from "@semoss/chat/components";
import { Textarea } from "@semoss/ui/next";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { useEngineConnect } from "../engine-connect-context";
import { type PropDoc, PropsTable } from "../props-table";
import { RequiresEngine } from "../requires-engine";

const PROPS: PropDoc[] = [
	{
		name: "input",
		type: "string",
		required: true,
		description: "The composer's current text.",
	},
	{
		name: "setInput",
		type: "(value: string) => void",
		required: true,
		description:
			"Rewrites the composer's text; one-step Undo restores the exact original.",
	},
	{ name: "disabled", type: "boolean", description: "" },
	{
		name: "modelId",
		type: "string",
		description: "The engine to run the LLM(...) optimize pixel against.",
	},
	{
		name: "instructions",
		type: "string",
		description:
			"Optional room instructions context passed to the optimizer.",
	},
];

const PromptOptimizerDemo = () => {
	const { engine } = useEngineConnect();
	const [input, setInput] = useState("tell me about jobs pls thx");

	return (
		<div className="flex flex-col gap-2">
			<Textarea
				value={input}
				onChange={(e) => setInput(e.target.value)}
				rows={3}
			/>
			<div className="self-start">
				<PromptOptimizer
					input={input}
					setInput={setInput}
					modelId={engine?.engineId}
				/>
			</div>
		</div>
	);
};

export const PromptOptimizerDoc = () => {
	return (
		<DocPage
			title="PromptOptimizer"
			description="An 'Improve prompt' button that runs a one-off LLM(...) pixel call to rewrite the composer's current text, with a one-step Undo. Self-contained — calls useInsight() directly, needs a real engine id."
		>
			<DemoSection
				description="Edit the text below, then click the wand to rewrite it against your connected engine — Undo restores the exact original."
				preview={
					<RequiresEngine>
						<PromptOptimizerDemo />
					</RequiresEngine>
				}
				code={`import { PromptOptimizer } from "@semoss/chat/components";

const [input, setInput] = useState("");

<Textarea value={input} onChange={(e) => setInput(e.target.value)} />
<PromptOptimizer input={input} setInput={setInput} modelId={engineId} />`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
