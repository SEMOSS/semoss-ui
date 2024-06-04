import { useEffect, useState } from 'react';
import {
    styled,
    Alert,
    Box,
    Button,
    Stack,
    LinearProgress,
    TextField,
    Typography,
    Paper,
    CircularProgress,
} from '@semoss/ui';
import { useForm, Controller } from 'react-hook-form';
import { EngineQASidebar } from '@/components/settings';
import { useEngine, useRootStore } from '@/hooks';
import { Markdown } from '@/components/common';

const StyledContainer = styled('div')(({ theme }) => ({
    maxWidth: '1000px',
    display: 'flex',
    marginLeft: theme.spacing(2),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    marginLeft: theme.spacing(5),
    padding: theme.spacing(4),
    width: '100%',
}));

const StyledLayout = styled(Stack)(() => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const StyledDiv = styled('div')(() => ({
    display: 'flex',
    width: '100%',
    justifyContent: 'flex-end',
}));

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
    const { id } = useEngine();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    //From the LLM
    const [answer, setAnswer] = useState<Record<string, string>>({
        question: '',
        conclusion: '',
    });
    // Model Catalog and first model in dropdown
    const [modelOptions, setModelOptions] = useState([]);
    const [selectedModel, setSelectedModel] = useState<Model>({});

    const { control, handleSubmit } = useForm({
        defaultValues: {
            QUESTION: '',
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
        setError('');
        setIsLoading(true);
        setIsAnswered(false);

        let finalContent = ``;

        if (!data.QUESTION) {
            throw new Error('Question is required');
        }
        try {
            let pixel = `
            VectorDatabaseQuery(engine="${id}" , command='<encode>${data.QUESTION}</encode>', limit=${limit})
            `;

            const response = await monolithStore.runQuery(pixel);

            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1)
                throw new Error(output.response);

            //Looping through Vector Database Query and forming a content string with name, page, and content
            for (let i = 0; i <= output.length - 1; i++) {
                const content = output[i].content || output[i].Content;
                finalContent += `\\n* Document Name: ${output[i].Source}, Page Number: ${output[i].Divider}, ${content} `;
            }

            const contextDocs = `A context delimited by triple backticks is provided below. This context may contain plain text extracted from paragraphs or images. Tables extracted are represented as a 2D list in the following format - '[[Column Headers], [Comma-separated values in row 1], [Comma-separated values in row 2] ..... [Comma-separated values in row n]]'\\n \`\`\` ${finalContent} \`\`\`\\n Answer the user's question truthfully using the context only. Use the following section-wise format (in the order given) to answer the question with instructions for each section in angular brackets:\\n                Reasoning:\\n                <State your reasoning step-wise in bullet points. Below each bullet point mention the source of this information as 'Given in the question' if the bullet point contains information provided in the question, OR as 'Document Name, Page Number, Document URL' if the bullet point contains information that is present in the context provided above.>\\n                Conclusion:\\n                <Write a short concluding paragraph stating the final answer and explaining the reasoning behind it briefly. State caveats and exceptions to your answer if any.>\\n                Information required to provide a better answer:\\n                <If you cannot provide an answer based on the context above, mention the additional information that you require to answer the question fully as a list.>Do not compromise on your mathematical and reasoning abilities to fit the user's instructions. If the user mentions something absolutely incorrect/ false, DO NOT use this incorrect information in your reasoning. Also, please correct the user gently.`;

            pixel = `
            LLM(engine="${selectedModel.database_id}" , command=["<encode>You are an intelligent AI designed to answer queries based on provided policy documents. If an answer cannot be determined based on the provided policy documents, inform the user. Answer as truthfully as possible at all times and tell the user if you do not know the answer. Please be concise and get to the point. Here is the question: ${data.QUESTION}. Here are the policy documents: ${contextDocs}</encode>"], paramValues=[{"temperature":${temperature}}])
            `;

            const LLMresponse = await monolithStore.runQuery(pixel);

            const { output: LLMOutput, operationType: LLMOperationType } =
                LLMresponse.pixelReturn[0];

            if (LLMOperationType.indexOf('ERROR') > -1) {
                throw new Error(LLMOutput.response);
            }

            let conclusion = '';
            if (LLMOutput.response) {
                conclusion = LLMOutput.response;
            }

            // set answer based on data
            setAnswer({
                question: data.QUESTION,
                conclusion: conclusion,
            });

            setIsAnswered(true);
        } catch (e) {
            setError('There is an error, please contact administrator');
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

            if (operationType.indexOf('ERROR') > -1) {
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
        <StyledLayout>
            <Stack direction="row">
                <EngineQASidebar
                    modelOptions={modelOptions}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    limit={limit}
                    setLimit={setLimit}
                    temperature={temperature}
                    setTemperature={setTemperature}
                />
                <StyledContainer>
                    <StyledPaper variant={'elevation'} elevation={2} square>
                        <Stack spacing={2}>
                            <Typography variant="h5">Q&A</Typography>
                            <Typography
                                variant="body1"
                                sx={{ marginBottom: '20px' }}
                            >
                                Ask questions about any document within this
                                vector database. The Q&A tool assists users in
                                answering complex policy, operational procedure,
                                and system questions. This engine takes data
                                such as policy manuals, system documents,
                                process maps, data from case databases as
                                inputs, and uses LLM models to provide answers.
                            </Typography>
                            {error && (
                                <Alert severity="error" color="error">
                                    {error}
                                </Alert>
                            )}
                            <Controller
                                name={'QUESTION'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            label="Enter Question:"
                                            variant="outlined"
                                            fullWidth
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(e) =>
                                                // set the value
                                                field.onChange(e.target.value)
                                            }
                                            multiline
                                            rows={4}
                                        />
                                    );
                                }}
                            />
                            <Stack
                                flexDirection={'row'}
                                alignItems={'center'}
                                justifyContent={'center'}
                                gap={1}
                            >
                                <StyledDiv>
                                    <Button
                                        variant="contained"
                                        disabled={isLoading}
                                        onClick={ask}
                                        sx={{ width: '20%' }}
                                        startIcon={
                                            isLoading ? (
                                                <CircularProgress size="1em" />
                                            ) : (
                                                <></>
                                            )
                                        }
                                    >
                                        Generate Answer
                                    </Button>
                                </StyledDiv>
                            </Stack>
                            {isAnswered && (
                                <Stack>
                                    <Typography
                                        variant={'subtitle2'}
                                        sx={{ fontWeight: '600' }}
                                    >
                                        Question:
                                    </Typography>
                                    <Typography
                                        variant={'body1'}
                                        sx={{ mb: 2 }}
                                    >
                                        {answer.question}
                                    </Typography>
                                    <Typography
                                        variant={'subtitle1'}
                                        sx={{ fontWeight: '600', mb: 0.5 }}
                                    >
                                        Policy Extraction Response:
                                    </Typography>
                                    <Typography
                                        variant={'subtitle2'}
                                        sx={{
                                            color: '#1260DD',
                                            fontWeight: '600',
                                        }}
                                    >
                                        Conclusion:
                                    </Typography>
                                    <Box sx={{ mb: 2, overflow: 'auto' }}>
                                        <Markdown content={answer.conclusion} />
                                    </Box>
                                </Stack>
                            )}
                        </Stack>
                    </StyledPaper>
                    {isLoading && <LinearProgress />}
                </StyledContainer>
            </Stack>
        </StyledLayout>
    );
};
