import { useEffect, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

export const PromptBuilderContextTestDialog = (props: {
	llm: string;
	context: string;
	open: boolean;
	close: () => void;
}) => {
	const { monolithStore } = useRootStore();
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState("");

	const ask = async () => {
		setLoading(true);
		const LLMresponse = await monolithStore.runQuery(
			`LLM(engine="${props.llm}", command=["<encode>${props.context}</encode>"])`,
		);
		const { output: LLMOutput } = LLMresponse.pixelReturn[0];
		setResponse(LLMOutput?.response ?? LLMOutput ?? "");
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
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Test Prompt</DialogTitle>
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
