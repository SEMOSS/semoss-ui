// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { useEffect, useMemo, useState } from "react";
import { usePixel } from "@/hooks";
import { INPUT_TYPE_TEXT, TOKEN_TYPE_INPUT } from "../../prompt.constants";
import type { Builder, Token } from "../../prompt.types";
import { PromptBuilderInputTypeSelection } from "./PromptBuilderInputTypeSelection";

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
		inputTypeMeta: any,
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
		<div className="m-2 h-full rounded-md border bg-card shadow-sm">
			<div className="px-8 pb-6 pt-8">
				<h6 className="text-lg font-semibold">Define Input Types</h6>
				<p className="text-base">
					Use the dropdowns to define the input types for each of your
					inputs.
				</p>
			</div>
			<div className="max-h-[480px] overflow-y-scroll px-8 py-2 flex flex-col gap-6">
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
			</div>
		</div>
	);
};
