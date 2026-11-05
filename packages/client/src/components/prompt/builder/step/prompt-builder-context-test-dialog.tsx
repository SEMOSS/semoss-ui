import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";

export const PromptBuilderContextTestDialog = (props: {
	llm: string;
	context: string;
	open: boolean;
	close: () => void;
}) => {
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState("");

	const ask = async () => {
		setLoading(true);
		const LLMresponse = await runPixel(
			`LLM(engine="${props.llm}", command=["<encode>${props.context}</encode>"])`,
		);
		const { output } = LLMresponse.pixelReturn[0];
		// the model answers with text, or an object holding it
		if (typeof output === "string") {
			setResponse(output);
		} else if (isRecord(output) && typeof output.response === "string") {
			setResponse(output.response);
		} else {
			setResponse("");
		}
		setLoading(false);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: ask is intentionally omitted; runs on open change only
	useEffect(() => {
		if (props.open) ask();
	}, [props.open]);

	return (
		<Dialog
			open={props.open}
			onOpenChange={(open) => !open && props.close()}
		>
			<DialogContent aria-describedby={undefined} className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Test Prompt
					</DialogTitle>
				</DialogHeader>
				<div className="flex h-[40vh] w-full items-center justify-center">
					{loading ? (
						<div className="flex flex-col items-center gap-2 text-muted-foreground">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							<span className="text-xs">
								Running your prompt context against the selected
								LLM...
							</span>
						</div>
					) : (
						<div className="h-full w-full overflow-y-auto rounded-md border border-border bg-muted/40 p-4">
							<p className="whitespace-pre-wrap text-sm leading-relaxed">
								{response}
							</p>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button onClick={ask} disabled={loading}>
						Retry
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
