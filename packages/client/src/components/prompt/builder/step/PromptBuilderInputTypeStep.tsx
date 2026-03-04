import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Box,
	Button,
	Grid,
	Paper,
	Stack,
	styled,
	Typography,
} from "@semoss/ui";
import { usePixel, useRootStore } from "@/hooks";
import { INPUT_TYPE_TEXT, TOKEN_TYPE_INPUT, TOKEN_TYPE_TEXT } from "../../prompt.constants";
import type { Builder, Token } from "../../prompt.types";
import { PromptBuilderInputTypeSelection } from "./PromptBuilderInputTypeSelection";

export const StyledStepPaper = styled(Paper)(({ theme }) => ({
	margin: theme.spacing(1),
	height: "100%",
}));
export const StyledBox = styled(Box)(({ theme }) => ({
	padding: theme.spacing(4),
	paddingBottom: theme.spacing(3),
}));
export const StyledStack = styled(Stack)(({ theme }) => ({
	padding: `${theme.spacing(1)} ${theme.spacing(4)}`,
	maxHeight: "480px",
	overflowY: "scroll",
}));
export const PromptBuilderInputTypeStep = (props: {
	builder: Builder;
	setBuilderValue: (builderStepKey: string, value: object | string) => void;
    modelId: string;
    setLLMResponse: (response: string) => void;
    setLLMTokens: (tokens: Token[]) => void;
    isLLMVersionSelected: boolean;
    setIsLLMVersionSelected: (value: boolean) => void;
}) => {
	const builderInputTypes = props.builder.inputTypes.value;

	const { monolithStore } = useRootStore();
    const [inputTokens, setInputTokens] = useState<Token[]>([]);
	const [inputTypes, setInputTypes] = useState({});

    const originalPrompt = props.builder.context.value as string;
    const SelectedKeys = inputTokens.map((token) => token.key);
    const [isInitialRender, setIsInitialRender] = useState(true); // State to track the initial render
    const [isPopupOpen, setIsPopupOpen] = useState(false); // State to track the popup open/close
    const [promptWithInputs, setPromptWithInputs] = useState(''); // State to hold prompt with inputs
    const [LllmPromptResponse, setLllmPromptResponse] = useState<string>(''); // State to hold LLM response
    const [isLLMVersionLoading, setIsLLMVersionLoading] = useState(true); // State to track LLM version loading for button

	const [cfgLibraryVectorDbs, setCfgLibraryVectorDbs] = useState({
		loading: false,
		ids: [],
		display: {},
	});
	const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState({
		loading: false,
		ids: [],
		display: {},
	});

	const myVectorDbs = usePixel<{ app_id: string; app_name: string }[]>(
		`MyEngines(engineTypes=['VECTOR']);`,
	);
	useMemo(() => {
		if (myVectorDbs.status !== "SUCCESS") {
			return;
		}

		const vectorDbIds: string[] = [];
		const vectorDbDisplay = {};
		myVectorDbs.data.forEach((vector) => {
			vectorDbIds.push(vector.app_id);
			vectorDbDisplay[vector.app_id] = vector.app_name;
		});
		setCfgLibraryVectorDbs({
			loading: false,
			ids: vectorDbIds,
			display: vectorDbDisplay,
		});
	}, [myVectorDbs.status, myVectorDbs.data]);

	const myDbs = usePixel<{ app_id: string; app_name: string }[]>(
		`MyEngines(engineTypes=['DATABASE']);`,
	);
	useMemo(() => {
		if (myDbs.status !== "SUCCESS") {
			return;
		}

		const dbIds: string[] = [];
		const dbDisplay = {};
		myDbs.data.forEach((vector) => {
			dbIds.push(vector.app_id);
			dbDisplay[vector.app_id] = vector.app_name;
		});
		setCfgLibraryDatabases({
			loading: false,
			ids: dbIds,
			display: dbDisplay,
		});
	}, [myDbs.status, myDbs.data]);

	/**
	 * Pulls in Builder state of inputTypes
	 */
	useEffect(() => {
		const tokens = [...(props.builder.inputs.value as Token[])];
		const filteredTokens = tokens.filter(
			(token) =>
				token.type === TOKEN_TYPE_INPUT &&
				!token.isHiddenPhraseInputToken &&
				(token.linkedInputToken !== undefined
					? token.index === token.linkedInputToken
					: true),
		);
		if (!builderInputTypes) {
			const keyedInputs = filteredTokens.reduce((acc, token: Token) => {
				return {
					...acc,
					[token.index]: { type: INPUT_TYPE_TEXT, meta: null },
				};
			}, {});

			setInputTypes(keyedInputs);
			props.setBuilderValue("inputTypes", keyedInputs);
		} else {
			setInputTypes(builderInputTypes);
		}

		setInputTokens(filteredTokens);
	}, [builderInputTypes]);

	const setInputType = (
		inputTokenIndex: number,
		inputType: string,
		inputTypeMeta: string | null,
	) => {
		const inputTypesDup = {
			...inputTypes,
			[inputTokenIndex]: {
                ...inputTypes[inputTokenIndex],
				type: inputType,
				meta: inputTypeMeta,
			},
		};

		setInputTypes(inputTypesDup);
		props.setBuilderValue("inputTypes", inputTypesDup);
	};

    const setInputLabel = (inputTokenIndex: number, inputLabel: string) => {
        setInputTypes((prevInputTypes) => {
            const inputTypesDup = {
                ...prevInputTypes,
                [inputTokenIndex]: {
                    ...prevInputTypes[inputTokenIndex],
                    label: inputLabel,
                },
            };
            props.setBuilderValue('inputTypes', inputTypesDup);
            return inputTypesDup;
        });
    };

    const generalizedPrompt = `Rephrase the following input for better clarity and readability while maintaining 
    its original intent. Replace each word inside {} with a broad and appropriate category label that represents 
    its meaning. Use sequential numbering only when multiple items belong to the same broad category. 
    Ensure the transformation enhances the prompt but does not introduce, remove, or alter details beyond 
    necessary refinements. Provide only the improved version without extra context or explanations.`;

    // Call the LLM API to get the LLM version of the prompt
    const promptGenerationLLMCall = async () => {
        let prompt = originalPrompt;
        const inputTokenValue = SelectedKeys;
        inputTokenValue.forEach((token) => {
            const regex = new RegExp(`\\b${token}\\b`, 'g');
            prompt = prompt.replace(regex, `{${token}}`);
        });
        setPromptWithInputs(prompt);
        setIsLLMVersionLoading(true);
        const LLMresponse = await monolithStore.runQuery(
            `LLM(engine="${props.builder.model.value}", command=["<encode>${generalizedPrompt}\n\n User Input: ${prompt}</encode>"])`,
        );
        setIsLLMVersionLoading(false);
        setLllmPromptResponse(LLMresponse.pixelReturn[0].output.response);
    };

    // Call the promptGenerationLLMCall function only on the initial render
    useEffect(() => {
        if (isInitialRender && inputTokens.length > 0) {
            promptGenerationLLMCall();
            setIsPopupOpen(true);
            setIsInitialRender(false); // Setting to false after the initial render
        }
    }, [isInitialRender, inputTokens]);

    const extractCategorisedLabels = (text: string): string[] => {
        const regex = /\{([^}]+)\}/g;
        const matches = [];
        let match;
        // Executes a search on a string using a regular expression pattern, and returns an array containing the results of that search.
        while ((match = regex.exec(text)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    };

    const handleLLMResponse = useCallback((LLMResponse: string) => {
        const tokens = LLMResponse.split(/(\s+|\{[^}]+\})/g)
            .filter(Boolean)
            .map((part, index) => {
                const isInputToken = part.startsWith('{') && part.endsWith('}');
                const key = isInputToken ? part.slice(1, -1) : part;
                return {
                    index: index,
                    key: key,
                    display: key,
                    type: isInputToken ? TOKEN_TYPE_INPUT : TOKEN_TYPE_TEXT,
                    isHiddenPhraseInputToken: false,
                    linkedInputToken: undefined,
                };
            });
        props.setLLMResponse(LLMResponse);
        props.setLLMTokens(tokens);
    }, [props.setLLMResponse, props.setLLMTokens]);

    // Call handleLLMResponse with the LLM response when the LLM version is selected to set the builder values
    useEffect(() => {
        if (props.isLLMVersionSelected) {
            handleLLMResponse(LllmPromptResponse);
        }
    }, [LllmPromptResponse, props.isLLMVersionSelected, handleLLMResponse]);

    // Extract the words in braces from the LLM response
    const wordsInBraces = extractCategorisedLabels(LllmPromptResponse);

    // Function to handle the LLM version
    const handleLLMVersionSelection = () => {
        props.setIsLLMVersionSelected(true);
        setIsPopupOpen(false);
    };


	return (
		<StyledStepPaper elevation={2} square>
			<StyledBox>
				<Typography variant="h6">Define Input Types</Typography>
				<Typography variant="body1">
					Use the dropdowns to define the input types for each of your
					inputs.
				</Typography>
			</StyledBox>
            <Dialog
                open={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle id="alert-dialog-title">
                    Prompt Selection
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="h6">User Prompt</Typography>
                            <Typography variant="body2">
                                {promptWithInputs}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="h6">
                                LLM Suggested Prompt
                            </Typography>
                            <Typography variant="body2">
                                {LllmPromptResponse}
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            props.setIsLLMVersionSelected(false);
                            setIsPopupOpen(false);
                        }}
                        color="primary"
                    >
                        User Version
                    </Button>
                    <Button
                        disabled={isLLMVersionLoading}
                        onClick={handleLLMVersionSelection}
                        color="primary"
                    >
                        LLM Version
                    </Button>
                </DialogActions>
            </Dialog>
			<StyledStack spacing={3}>
				{Array.from(inputTokens, (inputToken: Token, index) => (
					<PromptBuilderInputTypeSelection
						inputToken={inputToken}
						// optional chaining prevents crash after step 2 changes
						inputType={inputTypes[inputToken.index]?.type}
						inputTypeMeta={inputTypes[inputToken.index]?.meta}
						key={inputToken.index}
						cfgLibraryVectorDbs={cfgLibraryVectorDbs}
						cfgLibraryDatabases={cfgLibraryDatabases}
						setInputType={setInputType}
                        setInputLabel={setInputLabel}
                        userPrompt={props.builder.context.value as string}
                        modelId={props.builder.model.value as string}
                        setBuilderValue={(key, value) =>
                            props.setBuilderValue(key, value as string)
                        } // Cast value to string
                        LlmInputLabel={
                            props.isLLMVersionSelected
                                ? wordsInBraces[index]
                                : ''
                        } // Pass the label to the child
                        isLLMVersionSelected={props.isLLMVersionSelected}
					/>
				))}
			</StyledStack>
		</StyledStepPaper>
	);
};
