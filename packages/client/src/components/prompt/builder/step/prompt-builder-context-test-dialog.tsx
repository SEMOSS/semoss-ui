import { useEffect, useRef, useState } from "react";
import { useSessionInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

interface PromptBuilderContextTestDialogProps {
	/** ID of the LLM to run the context against */
	llm: string;

	/** The prompt context to run */
	context: string;

	/** Whether the dialog is open; opening it runs the test */
	open: boolean;

	/** Close the dialog */
	close: () => void;
}

/**
 * Runs the prompt's context against the chosen LLM and shows its response,
 * with Retry to run it again.
 */
export const PromptBuilderContextTestDialog = (
	props: PromptBuilderContextTestDialogProps,
) => {
	const { run: runPixel } = useSessionInsight();
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState("");
	const [error, setError] = useState("");
	const requestId = useRef(0);

	const ask = async () => {
		const currentRequest = ++requestId.current;
		setLoading(true);
		setError("");
		setResponse("");
		try {
			const result = await runPixel(
				`LLM(engine="${props.llm}", command=["<encode>${props.context}</encode>"])`,
			);
			if (result.errors.length) {
				throw new Error(result.errors.join(", "));
			}
			const output = result.pixelReturn[0]?.output;
			const text =
				typeof output === "object" &&
				output !== null &&
				"response" in output
					? output.response
					: output;
			if (typeof text !== "string") {
				throw new Error("The model returned an invalid response.");
			}
			if (currentRequest === requestId.current) {
				setResponse(text);
			}
		} catch (cause) {
			if (currentRequest === requestId.current) {
				setError(
					cause instanceof Error
						? cause.message
						: "Failed to run the prompt test.",
				);
			}
		} finally {
			if (currentRequest === requestId.current) {
				setLoading(false);
			}
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: ask is intentionally omitted; runs on open change only
	useEffect(() => {
		if (props.open) void ask();
		return () => {
			requestId.current++;
		};
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
					) : error ? (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
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
