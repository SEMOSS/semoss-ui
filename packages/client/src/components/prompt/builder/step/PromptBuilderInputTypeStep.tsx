// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { useEffect, useMemo, useState } from "react";
// import { StyledStepPaper } from '../../prompt.styled';
import { Box, Paper, Stack, styled, Typography } from "@semoss/ui";
import { usePixel } from "@/hooks";
import { INPUT_TYPE_TEXT, TOKEN_TYPE_INPUT } from "../../prompt.constants";
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
	setBuilderValue: (builderStepKey: string, value: object) => void;
}) => {
	const builderInputTypes = props.builder.inputTypes.value;

	const [inputTokens, setInputTokens] = useState([]);
	const [inputTypes, setInputTypes] = useState({});

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

	const myVectorDbs = usePixel<{ engine_id: string; engine_name: string }[]>(
		`MyEngines(engineTypes=['VECTOR']);`,
	);
	useMemo(() => {
		if (myVectorDbs.status !== "SUCCESS") {
			return;
		}

		const vectorDbIds: string[] = [];
		const vectorDbDisplay = {};
		myVectorDbs.data.forEach((vector) => {
			vectorDbIds.push(vector.engine_id);
			vectorDbDisplay[vector.engine_id] = vector.engine_name;
		});
		setCfgLibraryVectorDbs({
			loading: false,
			ids: vectorDbIds,
			display: vectorDbDisplay,
		});
	}, [myVectorDbs.status, myVectorDbs.data]);

	const myDbs = usePixel<{ engine_id: string; engine_name: string }[]>(
		`MyEngines(engineTypes=['DATABASE']);`,
	);
	useMemo(() => {
		if (myDbs.status !== "SUCCESS") {
			return;
		}

		const dbIds: string[] = [];
		const dbDisplay = {};
		myDbs.data.forEach((vector) => {
			dbIds.push(vector.engine_id);
			dbDisplay[vector.engine_id] = vector.engine_name;
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
				acc[token.index] = { type: INPUT_TYPE_TEXT, meta: null };
				return acc;
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
				type: inputType,
				meta: inputTypeMeta,
			},
		};

		setInputTypes(inputTypesDup);
		props.setBuilderValue("inputTypes", inputTypesDup);
	};

	// doesn't seem be necessary since the step is skipped if there are no inputs
	// needed to be removed so going back to step 2 wouldn't crash the app
	// if (Object.keys(inputTypes).length !== inputTokens.length) {
	//     return <></>;
	// }

	return (
		<StyledStepPaper elevation={2} square>
			<StyledBox>
				<Typography variant="h6">Define Input Types</Typography>
				<Typography variant="body1">
					Use the dropdowns to define the input types for each of your
					inputs.
				</Typography>
			</StyledBox>
			<StyledStack spacing={3}>
				{Array.from(inputTokens, (inputToken: Token) => (
					<PromptBuilderInputTypeSelection
						inputToken={inputToken}
						// optional chaining prevents crash after step 2 changes
						inputType={inputTypes[inputToken.index]?.type}
						inputTypeMeta={inputTypes[inputToken.index]?.meta}
						key={inputToken.index}
						cfgLibraryVectorDbs={cfgLibraryVectorDbs}
						cfgLibraryDatabases={cfgLibraryDatabases}
						setInputType={setInputType}
					/>
				))}
			</StyledStack>
		</StyledStepPaper>
	);
};
