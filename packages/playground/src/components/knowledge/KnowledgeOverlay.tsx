import { AddRounded, Close } from "@mui/icons-material";
import React, { useEffect, useRef, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	CircularProgress,
	IconButton,
	Menu,
	Modal,
	Stack,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { Engine, Knowledge } from "@/types";
import { ExistingKnowledge } from "./ExistingKnowledge";
import { NewKnowledge, NewKnowledgeData } from "./NewKnowledge";

const EMBEDDING_MODEL = import.meta.env.VITE_EMBEDDING_MODEL || "";
const ENABLE_NEW_KNOWLEDGE =
	import.meta.env.VITE_ENABLE_NEW_KNOWLEDGE === "true";

interface KnowledgeOverlayProps {
	/** Knowledge loaded into the room */
	knowledge: Knowledge | null;

	/** Callback triggered when the knowledge model is closed */
	onClose: (success: boolean, knowledge?: Knowledge | null) => void;
}

export const KnowledgeOverlay: React.FC<KnowledgeOverlayProps> = (props) => {
	const { knowledge, onClose } = props;

	const { actions } = useInsight();

	const notification = useNotification();

	const [selectedEngine, setSelectedEngine] = useState<Engine | null>(() => {
		if (!knowledge) {
			return null;
		}

		return {
			app_id: knowledge.id,
			app_name: knowledge.name,
			app_type: "KNOWLEDGE",
			description: "",
		};
	});
	const [newEngineData, setNewEngineData] = useState<NewKnowledgeData | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);

	// update when tools change
	useEffect(() => {
		const engine: Engine | null = knowledge
			? {
					app_id: knowledge.id,
					app_name: knowledge.name,
					app_type: "KNOWLEDGE",
					description: "",
				}
			: null;

		setSelectedEngine(engine);
	}, [knowledge]);

	const isMounted = useRef(false);
	useEffect(() => {
		isMounted.current = true;

		return () => {
			isMounted.current = false;
		};
	}, []);

	//TODO: Infinite Load
	/**
	 * Get all of the groups
	 */
	const getEngines = usePixel<Engine[]>(
		`MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description"])`,
		{
			data: [],
		},
	);

	let selectValue = "";
	if (newEngineData) {
		selectValue = "new";
	} else if (selectedEngine) {
		selectValue = `engine--${selectedEngine.app_id}`;
	}

	let isDisabled = true;
	if (
		newEngineData &&
		newEngineData.name &&
		newEngineData.description &&
		newEngineData.files.length > 0
	) {
		isDisabled = false;
	} else if (selectedEngine) {
		isDisabled = false;
	}

	/**
	 * onSave
	 */
	const onSave = async () => {
		let newEngineId = "";

		try {
			setIsLoading(true);

			if (newEngineData) {
				if (!ENABLE_NEW_KNOWLEDGE) {
					throw new Error("File Upload is disabled");
				}
				if (!newEngineData.name) {
					throw new Error("Name needs to be defined");
				}

				if (newEngineData.files.length === 0) {
					throw new Error("Files need to be added");
				}

				// check the name
				const checkEngineName = await actions.run<
					[{ exists: boolean }]
				>(`CheckEngineName ("${newEngineData.name}");`);

				// throw an error if it exists
				if (checkEngineName.pixelReturn[0].output.exists) {
					throw new Error(
						`Knowledge repository ${newEngineData.name} already exists. Please rename.`,
					);
				}

				// ignore if unmounted
				if (!isMounted.current) {
					return;
				}

				// create the engine
				const createEngine = await actions.run<
					[
						{
							database_id: string;
							database_name: string;
						},
					]
				>(
					`CreateVectorDatabaseEngine ( database=["${newEngineData.name}"], conDetails=[{"NAME":"${newEngineData.name}", "VECTOR_TYPE":"FAISS", "EMBEDDER_ENGINE_ID":"${EMBEDDING_MODEL}","INDEX_CLASSES":"default","CHUNKING_STRATEGY":"ALL","CONTENT_LENGTH":512,"CONTENT_OVERLAP":20,"KEEP_INPUT_OUTPUT":"true","DISTANCE_METHOD":"Squared Euclidean (L2) distance"}] );`,
				);

				// store the id
				newEngineId = createEngine.pixelReturn[0].output.database_id;
				const newEngineName =
					createEngine.pixelReturn[0].output.database_name;

				// delete if unmounted early
				if (!isMounted.current) {
					if (newEngineId) {
						await actions.run<[boolean]>(
							`DeleteEngine(engine=["${newEngineId}"]);`,
						);
					}
					return;
				}
				// upload files
				const uploaded = await actions.upload(newEngineData.files, "");

				// delete if unmounted early
				if (!isMounted.current) {
					if (newEngineId) {
						await actions.run<[boolean]>(
							`DeleteEngine(engine=["${newEngineId}"]);`,
						);
					}
					return;
				}

				// create the embeddings
				await actions.run<[boolean]>(
					`CreateEmbeddingsFromDocuments(engine="${newEngineId}", filePaths=${JSON.stringify(
						uploaded.map((f) => f.fileLocation),
					)}
                    );`,
				);

				// delete if unmounted early
				if (!isMounted.current) {
					if (newEngineId) {
						await actions.run<[boolean]>(
							`DeleteEngine(engine=["${newEngineId}"]);`,
						);
					}
					return;
				}

				// set the metadata
				await actions.run<[boolean]>(
					`SetEngineMetadata(engine="${newEngineId}", meta=[${JSON.stringify(
						{ description: newEngineData.description },
					)}], jsonCleanup=[true]);`,
				);

				// close it
				onClose(true, {
					id: newEngineId,
					name: newEngineName,
				});
			} else if (selectedEngine) {
				onClose(true, {
					id: selectedEngine.app_id,
					name: selectedEngine.app_name,
				});
			}
		} catch (e) {
			// delete if there is an error and it was created. This allows the user to recreate
			if (newEngineId) {
				await actions.run<[boolean]>(
					`DeleteEngine(engine=["${newEngineId}"]);`,
				);
			}

			notification.add({
				color: "error",
				message: e.message,
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			open={true}
			onClose={() => onClose(false)}
			aria-labelledby="attach knowledge"
			aria-describedby="attach knowledge"
			maxWidth={"sm"}
			fullWidth={true}
			scroll="paper"
		>
			<Modal.Title>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="h6">Add Knowledge</Typography>
					<IconButton size="small" onClick={() => onClose(false)}>
						<Close />
					</IconButton>
				</Stack>
			</Modal.Title>
			<Modal.Content>
				<Stack spacing={3}>
					<Stack spacing={2}>
						<Typography variant="subtitle1" fontWeight={"medium"}>
							Select a Knowledge Repository
						</Typography>
						<TextField
							size="small"
							variant={"outlined"}
							select
							disabled={isLoading}
							value={selectValue}
							onChange={(e) => {
								const value = e.target.value;

								if (value === "new") {
									setSelectedEngine(null);
									setNewEngineData({
										name: "",
										description: "",
										files: [],
									});
									return;
								}

								// find the engine
								const engineId = value.split("engine--")[1];

								let selectedEngine = null;
								if (engineId) {
									for (const e of getEngines.data) {
										if (e.app_id === engineId) {
											selectedEngine = e;
											break;
										}
									}
								}

								setSelectedEngine(selectedEngine);
								setNewEngineData(null);
							}}
							InputProps={{
								endAdornment:
									getEngines.status === "LOADING" ? (
										<CircularProgress
											size={"24px"}
											color={"primary"}
										/>
									) : null,
							}}
							fullWidth
						>
							{ENABLE_NEW_KNOWLEDGE ? (
								<Menu.Item value={`new`}>
									<Stack
										direction={"row"}
										spacing={1}
										alignItems={"center"}
									>
										<AddRounded fontSize="small" />
										<Typography variant="body1">
											New Knowledge Repository
										</Typography>
									</Stack>
								</Menu.Item>
							) : null}

							{getEngines.data?.map((e) => (
								<Menu.Item
									key={e.app_id}
									value={`engine--${e.app_id}`}
								>
									<Stack
										direction={"row"}
										alignItems={"center"}
									>
										<Typography variant="body1">
											{e.app_name}
										</Typography>
									</Stack>
								</Menu.Item>
							))}
						</TextField>
					</Stack>

					{selectedEngine ? (
						<ExistingKnowledge engine={selectedEngine} />
					) : null}
					{newEngineData ? (
						<NewKnowledge
							isDisabled={isLoading}
							data={newEngineData}
							setData={setNewEngineData}
						/>
					) : null}
				</Stack>
			</Modal.Content>
			<Modal.Actions>
				<Button variant="text" onClick={() => onClose(false)}>
					Cancel
				</Button>
				<Button
					variant="contained"
					disabled={isDisabled || isLoading}
					onClick={async () => onSave()}
					endIcon={
						isLoading ? (
							<CircularProgress size={"24px"} color={"primary"} />
						) : null
					}
				>
					{newEngineData ? "Add" : "Select"}
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
