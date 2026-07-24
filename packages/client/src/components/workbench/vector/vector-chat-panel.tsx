import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { runPixel, useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	H2,
	Large,
	Markdown,
	P,
	Small,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import {
	type Model,
	VectorChatPanelSidebar,
} from "./vector-chat-panel-sidebar";

interface VectorQueryRow {
	content?: string;
	Content?: string;
	Source?: string;
	Divider?: string;
}

interface LLMOutput {
	response?: string;
}

interface VectorChatPanelProps {
	/** Engine (vector) id to query */
	engine: string;
}

export const VectorChatPanel = ({ engine }: VectorChatPanelProps) => {
	const insight = useInsight();

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [isAnswered, setIsAnswered] = useState(false);
	const [answer, setAnswer] = useState<Record<string, string>>({
		question: "",
		conclusion: "",
	});
	const [modelOptions, setModelOptions] = useState<Model[]>([]);
	const [selectedModel, setSelectedModel] = useState<Model>({});
	const [limit, setLimit] = useState<number>(3);

	const { control, handleSubmit } = useForm({
		defaultValues: {
			QUESTION: "",
		},
	});

	const ask = handleSubmit(async (data: { QUESTION: string }) => {
		setError("");
		setIsLoading(true);
		setIsAnswered(false);

		let finalContent = ``;

		if (!data.QUESTION) {
			throw new Error("Question is required");
		}
		try {
			let pixel = `
            VectorDatabaseQuery(engine="${engine}" , command='<encode>${data.QUESTION}</encode>', limit=${limit});
            `;

			const response = await runPixel(pixel, insight.insightId);

			const { output, operationType } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") > -1)
				throw new Error((output as LLMOutput).response);

			const rows = output as VectorQueryRow[];

			for (let i = 0; i <= rows.length - 1; i++) {
				const content = rows[i].content || rows[i].Content;
				finalContent += `\\n* Document Name: ${rows[i].Source}, Page Number: ${rows[i].Divider}, ${content} `;
			}

			const contextDocs = `A context delimited by triple backticks is provided below. This context may contain plain text extracted from paragraphs or images. Tables extracted are represented as a 2D list in the following format - '[[Column Headers], [Comma-separated values in row 1], [Comma-separated values in row 2] ..... [Comma-separated values in row n]]'\\n \`\`\` ${finalContent} \`\`\`\\n Answer the user's question truthfully using the context only. Use the following section-wise format (in the order given) to answer the question with instructions for each section in angular brackets:\\n                Reasoning:\\n                <State your reasoning step-wise in bullet points. Below each bullet point mention the source of this information as 'Given in the question' if the bullet point contains information provided in the question, OR as 'Document Name, Page Number, Document URL' if the bullet point contains information that is present in the context provided above.>\\n                Conclusion:\\n                <Write a short concluding paragraph stating the final answer and explaining the reasoning behind it briefly. State caveats and exceptions to your answer if any.>\\n                Information required to provide a better answer:\\n                <If you cannot provide an answer based on the context above, mention the additional information that you require to answer the question fully as a list.>Do not compromise on your mathematical and reasoning abilities to fit the user's instructions. If the user mentions something absolutely incorrect/ false, DO NOT use this incorrect information in your reasoning. Also, please correct the user gently.`;

			pixel = `
            LLM(engine="${selectedModel.engine_id}" , command=["<encode>You are an intelligent AI designed to answer queries based on provided documents. If an answer cannot be determined based on the provided documents, inform the user. Answer as truthfully as possible at all times and tell the user if you do not know the answer. Please be concise and get to the point. Here is the question: ${data.QUESTION}. Here are the documents: ${contextDocs}</encode>"])            `;

			const LLMresponse = await runPixel(pixel, insight.insightId);

			const { output: llmOutput, operationType: LLMOperationType } =
				LLMresponse.pixelReturn[0];
			const llmResult = llmOutput as LLMOutput;

			if (LLMOperationType.indexOf("ERROR") > -1) {
				throw new Error(llmResult.response);
			}

			let conclusion = "";
			if (llmResult.response) {
				conclusion = llmResult.response;
			}

			setAnswer({
				question: data.QUESTION,
				conclusion: conclusion,
			});

			setIsAnswered(true);
		} catch (_e) {
			setError("There is an error, please contact administrator");
		} finally {
			setIsLoading(false);
		}
	});

	useEffect(() => {
		if (!insight.isReady) return;

		setIsLoading(true);
		const pixel = `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "text-generation" }] , engineTypes=["MODEL"]);`;

		runPixel(pixel, insight.insightId)
			.then((response) => {
				const { output, operationType } = response.pixelReturn[0];

				if (operationType.indexOf("ERROR") > -1) {
					throw new Error(output as unknown as string);
				}
				if (Array.isArray(output)) {
					setModelOptions(output as Model[]);
					setSelectedModel((output as Model[])[0]);
				}
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [insight.isReady, insight.insightId]);

	return (
		<div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:flex-row md:items-start">
			<VectorChatPanelSidebar
				modelOptions={modelOptions}
				selectedModel={selectedModel}
				setSelectedModel={setSelectedModel}
				limit={limit}
				setLimit={setLimit}
			/>
			<div className="min-w-0 flex-1">
				<Card className="w-full p-4 shadow-md">
					<CardContent className="flex flex-col gap-2 p-0">
						<H2 data-testid="engineQa-title">Q&A</H2>
						<P className="mb-5" data-testid="engineQa-description">
							Ask questions about any document within this vector
							database. The Q&A tool assists users in answering
							complex policy, operational procedure, and system
							questions. This engine takes data such as policy
							manuals, system documents, process maps, data from
							case databases as inputs, and uses LLM models to
							provide answers.
						</P>
						{error && (
							<Alert
								variant="destructive"
								data-testid="engineQa-error-alert"
							>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<Controller
							name={"QUESTION"}
							control={control}
							rules={{ required: true }}
							render={({ field }) => {
								return (
									<Textarea
										placeholder="Enter Question:"
										className="w-full"
										value={field.value ? field.value : ""}
										onChange={(e) =>
											field.onChange(e.target.value)
										}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" &&
												!e.shiftKey
											) {
												e.preventDefault();
												ask();
											}
										}}
										rows={4}
										data-testid="engineQa-question-input"
									/>
								);
							}}
						/>
						<div className="flex justify-end">
							<Button
								disabled={isLoading}
								onClick={ask}
								data-testid={"engineQa-generate-btn"}
							>
								{isLoading && <Spinner className="size-4" />}
								Generate Answer
							</Button>
						</div>
						{isAnswered && (
							<div className="mt-4 flex flex-col gap-2">
								<Small className="font-semibold">
									Question:
								</Small>
								<P className="mb-2">{answer.question}</P>
								<Large className="mb-0.5 font-semibold">
									Policy Extraction Response:
								</Large>
								<Small className="font-semibold text-primary">
									Conclusion:
								</Small>
								<div className="mb-2 overflow-auto">
									<Markdown>{answer.conclusion}</Markdown>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
