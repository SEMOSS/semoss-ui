import { PlayArrow, SaveOutlined, ShareRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useBlocks } from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import {
	Button,
	IconButton,
	Modal,
	Stack,
	Switch,
	TextField,
	Tooltip,
	useNotification,
} from "@semoss/ui";
import { ModelBrain } from "@/assets/img/ModelBrain";
import { ShareOverlay } from "@/components/ui";
import { PreviewOverlay } from "@/components/workspace";
import { useRootStore, useWorkspace } from "@/hooks";
import { LLMSelectOverlay } from "../llms";

export const BlocksWorkspaceActions = observer(() => {
	const { state } = useBlocks();

	const { monolithStore } = useRootStore();
	const notification = useNotification();
	const { workspace } = useWorkspace();
	const [modalOpen, setModalOpen] = useState(false);
	const [commitMsg, setCommitMsg] = useState("");
	// When true, require a commit message before saving (opens modal). When false, save immediately without message.
	// Use global workspace toggle
	const toggleChecked = workspace.requireCommitMessage;

	const removePageIdsFromURL = () => {
		const url = window.location.href;
		const pages = state.getAllBlocksOfType("page").map((page) => page.id);
		const matchedSubstring = pages.find((sub) => url.includes(sub));
		if (matchedSubstring) {
			const cleanedUrl = matchedSubstring
				? url
						.replace(matchedSubstring, "")
						.replace(/\/+$/, "") // remove trailing slash if left
				: url;
			window.location.href = cleanedUrl;
		}
	};
	/**
	 * Select default model
	 * TODO: We should probably just make this call in workspace so it persists across app
	 */
	const selectModel = async () => {
		let modelList = [];
		if (workspace.role === "OWNER" || workspace.role === "EDIT") {
			const pixel = `MyEngines(engineTypes=["MODEL"])`;
			const res = await runPixel(pixel);

			const list = res.pixelReturn[0].output as Array<{
				database_subtype: string;
				database_type: string;
				database_name: string;
				database_id: string;
				app_name: string;
			}>;

			modelList = list.map((model) => {
				return {
					label: model.database_name,
					value: model.database_id,
				};
			});
		}
		workspace.openOverlay(
			() => (
				<LLMSelectOverlay
					llmList={modelList || []}
					selectedLLM={workspace.agentModelEngine || ""}
					onSelect={(id: string) => {
						workspace.setAgentModelEngine(id);
					}}
					onClose={() => {
						workspace.closeOverlay();
					}}
				/>
			),
			{
				maxWidth: "sm",
			},
		);
	};

	/**
	 * Preview the current App
	 */
	const previewApp = () => {
		try {
			//before entering preview, remove page id's from the url if any exsist
			removePageIdsFromURL();
			// get the current state
			const json = state.toJSON();

			workspace.openOverlay(
				() => (
					<PreviewOverlay
						state={json}
						onClose={() => {
							workspace.closeOverlay();
						}}
					/>
				),
				{
					maxWidth: "lg",
				},
			);
		} catch (e) {
			console.error(e);

			notification.add({
				color: "error",
				message: e.message,
			});
		}
	};

	/**
	 * Save the current app
	 */
	const saveApp = async () => {
		// turn on loading
		workspace.setLoading(true);

		// convert the state to json
		const json = state.toJSON();

		// remove the visual from the json
		Object.keys(json?.blocks).forEach((key) => {
			if (key.startsWith("e-chart")) {
				if (json?.blocks[key]?.data?.option?.["visual"]) {
					json.blocks[key].data.option["visual"] = false;
				}
			}
		});
		try {
			// save the json
			const { errors } = await monolithStore.runQuery<[true]>(
				`SaveAppBlocksJson(project=["${
					workspace.appId
				}"], json=["<encode>${JSON.stringify(json)}</encode>"],
                comment=[${JSON.stringify(commitMsg)}]
                );`,
			);

			if (errors.length > 0) {
				throw new Error(errors.join(""));
			}

			const successMsg = commitMsg.trim()
				? `Save successful !! File is saved with the following commit message: ${commitMsg}`
				: "Save successful !!";
			notification.add({
				color: "success",
				message: successMsg,
			});
		} catch (e) {
			console.error(e);

			notification.add({
				color: "error",
				message: e.message,
			});
		} finally {
			// turn of loading
			workspace.setLoading(false);
			setCommitMsg("");
		}
	};
	const handleModalSave = async () => {
		setModalOpen(false);
		await saveApp();
	};

	/**
	 * Share the current App
	 */
	const shareApp = async () => {
		// turn on loading
		workspace.setLoading(true);

		try {
			let isChanged = false;

			// only get the json if the user can edit
			if (workspace.role === "OWNER" || workspace.role === "EDIT") {
				const { pixelReturn, errors } = await monolithStore.runQuery<
					[true]
				>(`GetAppBlocksJson ( project=['${workspace.appId}']);`);

				if (errors.length > 0) {
					throw new Error(errors.join(""));
				}

				const { output } = pixelReturn[0];

				// TODO: Do we want a better way to check if it is changed
				isChanged =
					JSON.stringify(output) !== JSON.stringify(state.toJSON());
			}

			workspace.openOverlay(() => (
				<ShareOverlay
					diffs={isChanged}
					appId={workspace.appId}
					onClose={() => workspace.closeOverlay()}
				/>
			));
		} catch (e) {
			console.error(e);

			notification.add({
				color: "error",
				message: e.message,
			});
		} finally {
			// turn of loading
			workspace.setLoading(false);
		}
	};

	useEffect(() => {
		/**
		 * Trigger save on ctrl + s or command + s
		 */
		const onDocumentKeydown = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key === "s") {
				event.preventDefault();
				if (workspace.requireCommitMessage) {
					setModalOpen(true);
				} else {
					// save immediately without commit message
					saveApp();
				}
			}
		};

		// attach the event listener
		document.addEventListener("keydown", onDocumentKeydown);

		// remove the event listener
		return () => {
			document.removeEventListener("keydown", onDocumentKeydown);
		};
	}, [workspace.requireCommitMessage]);

	return (
		<>
			<Stack direction="row" spacing={1} alignItems={"center"}>
				<Tooltip
					title={
						workspace.requireCommitMessage
							? "Require commit message on save"
							: "Save changes without commit message"
					}
				>
					<Switch
						checked={workspace.requireCommitMessage}
						onChange={() => {
							const next = !workspace.requireCommitMessage;
							workspace.setRequireCommitMessage(next);
							if (!next) {
								setCommitMsg("");
							}
						}}
						color="primary"
						size="small"
					/>
				</Tooltip>
				<Tooltip title={"Modal Selection"}>
					<IconButton
						size={"small"}
						color="default"
						onClick={() => {
							selectModel();
						}}
					>
						<ModelBrain
							width={"18"}
							height={"18"}
							color={
								workspace.agentModelEngine
									? "#0471f0"
									: "#666666"
							}
						/>
					</IconButton>
				</Tooltip>
				<Tooltip title="Preview App">
					<IconButton
						size={"small"}
						color="default"
						onClick={() => {
							previewApp();
						}}
					>
						<PlayArrow fontSize="inherit" />
					</IconButton>
				</Tooltip>
				<Tooltip title={"Share App"}>
					<IconButton
						size={"small"}
						color="default"
						onClick={() => {
							shareApp();
						}}
					>
						<ShareRounded fontSize="inherit" />
					</IconButton>
				</Tooltip>
				<Tooltip title={"Save App (ctrl/command + s)"}>
					<IconButton
						size={"small"}
						color={"primary"}
						onClick={() => {
							if (workspace.requireCommitMessage) {
								setModalOpen(true);
							} else {
								saveApp();
							}
						}}
					>
						<SaveOutlined fontSize="inherit" />
					</IconButton>
				</Tooltip>
			</Stack>
			<Modal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				aria-labelledby="commit-modal-title"
				aria-describedby="commit-modal-description"
				fullWidth
			>
				<Modal.Title>Enter Commit Message</Modal.Title>
				<Modal.Content>
					<Stack spacing={2}>
						<TextField
							autoFocus
							fullWidth
							multiline
							minRows={1}
							maxRows={5}
							label="Commit Message"
							value={commitMsg}
							onChange={(e) => setCommitMsg(e.target.value)}
						/>
					</Stack>
				</Modal.Content>
				<Modal.Actions>
					<Stack
						flex={1}
						direction="row"
						justifyContent="end"
						alignItems="center"
						spacing={1}
						padding={2}
					>
						<Button
							variant="contained"
							color="primary"
							disabled={toggleChecked && !commitMsg.trim()}
							onClick={handleModalSave}
						>
							Save
						</Button>
					</Stack>
				</Modal.Actions>
			</Modal>
		</>
	);
});
