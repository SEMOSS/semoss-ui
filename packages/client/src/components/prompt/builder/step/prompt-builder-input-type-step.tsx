// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { useEffect, useMemo, useState } from "react";
import { usePixel } from "@/hooks";
import { INPUT_TYPE_TEXT, TOKEN_TYPE_INPUT } from "../../prompt.constants";
import type { Builder, Token } from "../../prompt.types";
import { PromptBuilderInputTypeSelection } from "./prompt-builder-input-type-selection";

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
		inputTypeMeta: unknown,
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

	return (
		<div className="m-1 h-full bg-background shadow-sm">
			<div className="px-8 pt-8 pb-6">
				<h2 className="font-semibold text-lg">Define Input Types</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Use the dropdowns to define the input types for each of your
					inputs.
				</p>
			</div>
			<div className="flex max-h-[480px] flex-col gap-6 overflow-y-auto px-8 pb-8">
				{inputTokens.map((inputToken: Token) => (
					<PromptBuilderInputTypeSelection
						inputToken={inputToken}
						inputType={inputTypes[inputToken.index]?.type}
						inputTypeMeta={inputTypes[inputToken.index]?.meta}
						key={inputToken.index}
						cfgLibraryVectorDbs={cfgLibraryVectorDbs}
						cfgLibraryDatabases={cfgLibraryDatabases}
						setInputType={setInputType}
					/>
				))}
			</div>
		</div>
	);
};
