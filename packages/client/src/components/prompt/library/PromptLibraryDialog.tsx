import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { setBlocksAndOpenUIBuilder } from "../prompt.helpers";
import type { Builder, Token } from "../prompt.types";
import { PromptExamples } from "./examples";
import { PromptLibraryCards } from "./PromptLibraryCards";
import { PromptLibraryList } from "./PromptLibraryList";

export const PromptLibraryDialog = (props: {
	builder: Builder;
	promptLibraryOpen: boolean;
	closePromptLibrary: () => void;
}) => {
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();
	const [filter, setFilter] = useState("all");

	const filteredPrompts = () => {
		return PromptExamples.filter((prompt) => {
			if (filter == "all") {
				return true;
			} else {
				return prompt.tags.includes(filter);
			}
		}).sort((a, b) => {
			const firstTitle = a.title.toLowerCase();
			const secondTitle = b.title.toLowerCase();
			if (firstTitle < secondTitle) {
				return -1;
			}
			if (firstTitle > secondTitle) {
				return 1;
			}
			return 0;
		});
	};

	async function openUIBuilderForTemplate(
		title: string,
		tags: string[],
		inputs: Token[],
		inputTypes: object,
	) {
		const templateBuilder: Builder = JSON.parse(
			JSON.stringify(props.builder),
		);
		templateBuilder.title.value = templateBuilder.title.value ?? title;
		templateBuilder.inputs.value = inputs;
		templateBuilder.inputTypes.value = inputTypes;
		try {
			await setBlocksAndOpenUIBuilder(
				templateBuilder,
				monolithStore,
				navigate,
			);
		} catch (e) {
			toast.error(e.message);
		}
	}

	return (
		<Dialog open={props.promptLibraryOpen} onOpenChange={(open) => { if (!open) props.closePromptLibrary(); }}>
			<DialogContent className="max-w-5xl">
				<DialogHeader>
					<DialogTitle>Prompt Library</DialogTitle>
				</DialogHeader>
				<div className="h-[60vh] overflow-auto">
					<div className="grid grid-cols-12 gap-4">
						<div className="col-span-2">
							{/* TODO: Needs to play well with what we have */}
						</div>
						<div className="col-span-10">
							{/* TODO: onClick needs to play well with Agent Builders openUIBuilderForTemplate  */}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
