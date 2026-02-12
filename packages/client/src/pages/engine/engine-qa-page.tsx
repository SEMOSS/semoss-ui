import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { EngineQASidebar } from "@/components/settings";
import { useEngine, useRootStore } from "@/hooks";

export interface Model {
    database_name?: string;
    database_id?: string;
}

export interface VectorContext {
    score: string;
    doc_index: string;
    tokens: string;
    content: string;
    url: string;
}

export const EngineQAPage = () => {
    const { active } = useEngine();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isAnswered, setIsAnswered] = useState(false);
    //From the LLM
    const [answer, setAnswer] = useState<Record<string, string>>({
        question: "",
        conclusion: "",
    });
    // Model Catalog and first model in dropdown
    const [modelOptions, setModelOptions] = useState([]);
    const [selectedModel, setSelectedModel] = useState<Model>({});

    const { control, handleSubmit } = useForm({
        defaultValues: {
            QUESTION: "",
        },
    });

    const [limit, setLimit] = useState<number>(3);
    const [temperature, setTemperature] = useState<number>(0.1);

    const { monolithStore } = useRootStore();

    /**
     * Allow the user to ask a question
     */
    const ask = handleSubmit(async (data: { QUESTION: string }) => {
        // turn on loading
        setError("");
        setIsLoading(true);
        setIsAnswered(false);

        let finalContent = ``;

        if (!data.QUESTION) {
            throw new Error("Question is required");
        }
        try {
            let pixel = `
            VectorDatabaseQuery(engine="${active.id}" , command='<encode>${data.QUESTION}</encode>', limit=${limit})
            `;

            const response = await monolithStore.runQuery(pixel);

            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf("ERROR") > -1)
                throw new Error(output.response);

            //Looping through Vector Database Query and forming a content string with name, page, and content
            for (let i = 0; i <= output.length - 1; i++) {
                const content = output[i].content || output[i].Content;
                finalContent += `\\n* Document Name: ${output[i].Source}, Page Number: ${output[i].Divider}, ${content} `;
            }

            const contextDocs = `A context delimited by triple backticks is provided below. This context may contain plain text extracted from paragraphs or images. Tables extracted are represented as a 2D list in the following format - '[[Column Headers], [Comma-separated values in row 1], [Comma-separated values in row 2] ..... [Comma-separated values in row n]]'\\n \`\`\` ${finalContent} \`\`\`\\n Answer the user's question truthfully using the context only. Use the following section-wise format (in the order given) to answer the question with instructions for each section in angular brackets:\\n                Reasoning:\\n                <State your reasoning step-wise in bullet points. Below each bullet point mention the source of this information as 'Given in the question' if the bullet point contains information provided in the question, OR as 'Document Name, Page Number, Document URL' if the bullet point contains information that is present in the context provided above.>\\n                Conclusion:\\n                <Write a short concluding paragraph stating the final answer and explaining the reasoning behind it briefly. State caveats and exceptions to your answer if any.>\\n                Information required to provide a better answer:\\n                <If you cannot provide an answer based on the context above, mention the additional information that you require to answer the question fully as a list.>Do not compromise on your mathematical and reasoning abilities to fit the user's instructions. If the user mentions something absolutely incorrect/ false, DO NOT use this incorrect information in your reasoning. Also, please correct the user gently.`;

            pixel = `
            LLM(engine="${selectedModel.database_id}" , command=["<encode>You are an intelligent AI designed to answer queries based on provided documents. If an answer cannot be determined based on the provided documents, inform the user. Answer as truthfully as possible at all times and tell the user if you do not know the answer. Please be concise and get to the point. Here is the question: ${data.QUESTION}. Here are the documents: ${contextDocs}</encode>"], paramValues=[{"temperature":${temperature}}])            `;

            const LLMresponse = await monolithStore.runQuery(pixel);

            const { output: LLMOutput, operationType: LLMOperationType } =
                LLMresponse.pixelReturn[0];

            if (LLMOperationType.indexOf("ERROR") > -1) {
                throw new Error(LLMOutput.response);
            }

            let conclusion = "";
            if (LLMOutput.response) {
                conclusion = LLMOutput.response;
            }

            // set answer based on data
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
        setIsLoading(true);
        //Grabbing all the Models that are in CfG
        const pixel = `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "text-generation" }] , engineTypes=["MODEL"]);`;

        monolithStore.runQuery(pixel).then((response) => {
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf("ERROR") > -1) {
                throw new Error(output as string);
            }
            if (Array.isArray(output)) {
                setModelOptions(output);
                setSelectedModel(output[0]);
            }
        });
        setIsLoading(false);
    }, []);

    return (
        <div className="flex flex-row justify-between">
            <div className="flex flex-row">
                <EngineQASidebar
                    modelOptions={modelOptions}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    limit={limit}
                    setLimit={setLimit}
                    temperature={temperature}
                    setTemperature={setTemperature}
                />
                <div className="ml-2 flex max-w-[1000px]">
                    <Card className="ml-5 w-full p-4 shadow-md">
                        <CardContent className="flex flex-col gap-2 p-0">
                            <H2 data-testid="engineQa-title">Q&A</H2>
                            <P
                                className="mb-5"
                                data-testid="engineQa-description"
                            >
                                Ask questions about any document within this
                                vector database. The Q&A tool assists users in
                                answering complex policy, operational procedure,
                                and system questions. This engine takes data
                                such as policy manuals, system documents,
                                process maps, data from case databases as
                                inputs, and uses LLM models to provide answers.
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
                                            value={
                                                field.value ? field.value : ""
                                            }
                                            onChange={(e) =>
                                                // set the value
                                                field.onChange(e.target.value)
                                            }
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
                                    {isLoading && (
                                        <Spinner className="size-4" />
                                    )}
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
                                    <Small className="font-semibold text-[#1260DD]">
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
        </div>
    );
};
