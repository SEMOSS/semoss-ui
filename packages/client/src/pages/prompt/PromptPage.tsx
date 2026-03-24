import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Button, Grid, Stack, Typography } from "@semoss/ui";
import { PromptLibraryList } from "@/components/prompt/library/PromptLibraryList";
import { useRootStore } from "@/hooks";
import { PromptLibraryCards } from "../../components/prompt/library/PromptLibraryCards";
import type { Prompt } from "../../components/prompt/prompt.types";
import { PromptModal } from "./PromptModal";

export const PromptPage = observer(() => {
	const { monolithStore } = useRootStore();
	const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
	const [promptMode, setPromptMode] = useState("");
	const [promptToEdit, setPromptToEdit] = useState({});
	const [pageReload, setPageReload] = useState(false);

	const [filter, setFilter] = useState("all");
	const [allPrompts, setAllPrompts] = useState([]);

	/**
	 * @desc Load prompts
	 */
	useEffect(() => {
		init();
	}, [pageReload]);

	/**
	 * @desc Gets All prompts
	 */
	const init = () => {
		monolithStore.runQuery("ListPrompt()").then((response) => {
			const { output } = response.pixelReturn[0];
			if (output.length > 0) {
				const promptArr = [];
				output.forEach((prompt) => {
					promptArr.push({
						context: prompt.context ? prompt.context : "",
						created_by: prompt.created_by ? prompt.created_by : "",
						date_created: prompt.date_created
							? prompt.date_created
							: "",
						id: prompt.id ? prompt.id : "",
						intent: prompt.intent ? prompt.intent : "",
						title: prompt.title ? prompt.title : "",
						tags: prompt.tags ? prompt.tags : [],
					});
				});
				setAllPrompts(promptArr);
			}
		});
	};

	/**
	 * @desc Filters our prompts based on filter specified
	 * TODO: Have backend handle filtering on ListPrompt()
	 */
	const filteredPrompts = () => {
		return allPrompts.length > 0
			? allPrompts
					.filter((prompt) => {
						if (filter === "all") {
							return true;
						} else {
							return prompt.tags
								? prompt.tags.includes(filter)
								: false;
						}
					})
					.sort((a, b) => {
						const firstTitle = a.title.toLowerCase();
						const secondTitle = b.title.toLowerCase();
						if (firstTitle < secondTitle) {
							return -1;
						}
						if (firstTitle > secondTitle) {
							return 1;
						}
						return 0;
					})
			: [];
	};

	/**
	 * @desc Used on click of prompt card
	 */
	async function handlePromptEditClick(p: Prompt) {
		const tempPrompt = {
			title: p.title,
			tags: p.tags,
			context: p.context,
			id: p.id,
			intent: p.intent ? p.intent : "",
		};
		setPromptToEdit(tempPrompt);
		setPromptMode("Edit");
		setIsPromptModalOpen(true);
	}

	return (
		<Stack direction="column" gap={2}>
			<Stack>
				<Stack
					direction="row"
					alignItems={"center"}
					justifyContent={"space-between"}
					spacing={4}
				>
					<Stack direction="row" alignItems={"center"} spacing={2}>
						<Typography
							data-tour="app-library-title"
							variant={"h4"}
						>
							Prompt Catalog
						</Typography>
					</Stack>
					<Button
						size={"large"}
						variant={"contained"}
						onClick={() => {
							setPromptMode("Add");
							setIsPromptModalOpen(true);
						}}
						aria-label={`Add Prompt`}
						data-testid={"promptPage-add-btn"}
					>
						Add Prompt
					</Button>
				</Stack>
				<Stack
					direction="row"
					alignItems={"center"}
					justifyContent={"space-between"}
					spacing={4}
					sx={{ paddingTop: "10px" }}
				>
					<Typography variant={"subtitle1"}>
						Our prompt catalog is a versatile library of prompts
						designed for various use cases. It offers an abstracted
						interface, allowing developers and data scientists to
						easily select and integrate the right prompts into their
						applications. This flexibility ensures optimized
						workflows and improved outcomes.
					</Typography>
				</Stack>
			</Stack>
			<Grid container spacing={2}>
				<Grid item xs={2}>
					<PromptLibraryList
						filter={filter}
						setFilter={setFilter}
						reload={pageReload}
					/>
				</Grid>
				<Grid item xs={10}>
					<PromptLibraryCards
						filter={filter}
						prompts={filteredPrompts()}
						onClick={(p: Prompt) => {
							handlePromptEditClick(p);
						}}
					/>
				</Grid>
			</Grid>
			<PromptModal
				isOpen={isPromptModalOpen}
				prompt={promptToEdit}
				onClose={(reload) => {
					setIsPromptModalOpen(false);
					if (reload) {
						setPageReload(!pageReload);
					}
				}}
				mode={promptMode}
			></PromptModal>
		</Stack>
	);
});
