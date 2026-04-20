import { useEffect, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
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

	useEffect(() => {
		if (props.open) {
			ask();
		}
	}, [props.open]);

	return (
		<Dialog open={props.open} onOpenChange={(open) => { if (!open) props.close(); }}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Test Prompt</DialogTitle>
				</DialogHeader>
				<div className="h-[35vh] overflow-auto">
					{loading ? (
						<div className="flex h-full w-full flex-col items-center justify-center gap-2">
							<Spinner />
							<span className="text-xs text-muted-foreground">
								Running your prompt context against the selected
								LLM...
							</span>
						</div>
					) : (
						response
					)}
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={props.close}
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={ask}
						disabled={loading}
					>
						Retry
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
