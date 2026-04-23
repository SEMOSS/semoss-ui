import { Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useLLM, useRootStore } from "@/hooks";

export const TextEditorCodeGeneration = () => {
	const { modelId, modelOptions, setModel: setModelId } = useLLM();
	const { monolithStore } = useRootStore();
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [code, setCode] = useState("");
	const [prompt, setPrompt] = useState("");

	const generateCode = async () => {
		try {
			if (!modelId) {
				throw new Error("Model is required");
			}

			if (!prompt) {
				throw new Error("Prompt is required");
			}

			setIsLoading(true);

			const response = await monolithStore.runQuery(
				`LLM(engine=["${modelId}"], command=["Create code with the user prompt: ${prompt}, No additional explanation or text is needed."], paramValues=[{}])`,
			);

			const { output, operationType } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(output);
			}

			const codeMatch = output.response.replace(/^```|```$/g, "");

			if (!codeMatch) {
				throw new Error("Unable to parse generated code");
			}

			setCode(codeMatch);
		} catch (e) {
			console.log(e);
			toast.error(e.message);
		} finally {
			setIsLoading(false);
		}
	};

	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Successfully copied code");
		} catch (_e) {
			toast.error("Unable to copy code");
		}
	};

	return (
		<>
			<Button
				className="w-full gap-1 bg-purple-400 text-white hover:bg-purple-300"
				onClick={() => setIsOpen(true)}
			>
				<Sparkles className="size-4" />
				Generate Code
			</Button>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="sm:max-w-2xl" showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Generate Code</DialogTitle>
					</DialogHeader>

					<div className="flex flex-col gap-3 py-2">
						<div className="flex flex-col gap-1.5">
							<Label>Model</Label>
							<Select
								value={modelId}
								onValueChange={(val) => setModelId(val)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select a model" />
								</SelectTrigger>
								<SelectContent>
									{modelOptions.map((m) => (
										<SelectItem
											key={m.app_id}
											value={m.app_id}
										>
											{m.app_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label>Prompt</Label>
							<Textarea
								placeholder='Example: "Write me an HTML form that takes in patient information"'
								rows={3}
								onKeyDown={(e) => {
									if (e.code === "Enter") generateCode();
								}}
								onChange={(e) => setPrompt(e.target.value)}
							/>
						</div>

						{isLoading && <Skeleton className="h-[200px] w-full" />}

						{!isLoading && code && (
							<div className="overflow-hidden rounded-md border">
								<div className="flex items-center justify-between bg-secondary px-3 py-2">
									<span className="text-muted-foreground text-xs">
										Generated code
									</span>
									<Button
										size="sm"
										variant="outline"
										onClick={() => copy(code)}
									>
										<Copy className="size-3.5" />
										Copy
									</Button>
								</div>
								<pre className="overflow-x-auto bg-secondary/50 p-4 text-sm">
									<code>{code}</code>
								</pre>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setIsOpen(false)}
						>
							Cancel
						</Button>
						<Button
							className="gap-1 bg-purple-400 text-white hover:bg-purple-300"
							onClick={generateCode}
						>
							Generate
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
