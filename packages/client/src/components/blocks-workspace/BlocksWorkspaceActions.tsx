import { PreviewRounded, SaveRounded, ShareRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useBlocks } from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import { IconButton, Stack, Tooltip, useNotification } from "@semoss/ui";
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
				engine_subtype: string;
				engine_type: string;
				engine_name: string;
				engine_id: string;
			}>;

			modelList = list.map((model) => {
				return {
					label: model.engine_name,
					value: model.engine_id,
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
				if (json?.blocks[key]?.data?.option?.visual) {
					json.blocks[key].data.option.visual = false;
				}
			}
		});
		try {
			// save the json
			const { errors } = await monolithStore.runQuery<[true]>(
				`SaveAppBlocksJson(project=["${
					workspace.appId
				}"], json=["<encode>${JSON.stringify(json)}</encode>"]);`,
			);

			if (errors.length > 0) {
				throw new Error(errors.join(""));
			}

			notification.add({
				color: "success",
				message:
					"Save successful! Make sure to double-check your changes for correctness",
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
		}
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
				saveApp();
			}
		};

		// attach the event listener
		document.addEventListener("keydown", onDocumentKeydown);

		// remove the event listener
		return () => {
			document.removeEventListener("keydown", onDocumentKeydown);
		};
	}, []);

	return (
		<Stack direction="row" spacing={1} alignItems={"center"}>
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
							workspace.agentModelEngine ? "#0471f0" : "#666666"
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
					<PreviewRounded fontSize="inherit" />
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
					color="default"
					onClick={() => {
						saveApp();
					}}
				>
					<SaveRounded fontSize="inherit" />
				</IconButton>
			</Tooltip>
		</Stack>
	);
});
