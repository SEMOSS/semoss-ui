import { useEffect, useState } from "react";
import { useRootStore } from "@/hooks";
import {
	LIBRARY_PROMPT_TAG_BUSINESS,
	LIBRARY_PROMPT_TAG_COMMUNICATIONS,
	LIBRARY_PROMPT_TAG_TRAVEL,
} from "../prompt.constants";

const LIBRARY_CATEGORIES = [
	"all",
	LIBRARY_PROMPT_TAG_BUSINESS,
	LIBRARY_PROMPT_TAG_COMMUNICATIONS,
	LIBRARY_PROMPT_TAG_TRAVEL,
];

interface PromptLibraryListProps {
	/**
	 *
	 */
	filter: string;

	/**
	 *
	 * @param filter
	 * @returns
	 */
	setFilter: (filter: string) => void;

	/**
	 *
	 */
	reload?: boolean;
}

export const PromptLibraryList = (props: PromptLibraryListProps) => {
	const { filter, reload, setFilter } = props;
	const { monolithStore } = useRootStore();
	const [promptTags, setPromptTags] = useState([]);

	/**
	 * @desc
	 */
	useEffect(() => {
		init();
	}, [reload]);

	/**
	 * @desc Gets all filter options
	 */
	const init = () => {
		monolithStore
			.runQuery('GetPromptMetaValues( metaKeys = ["tag","domain"])')
			.then((response) => {
				const { output } = response.pixelReturn[0];
				if (output.length > 0) {
					const tagMap = { all: "" };
					output.map((tag) => {
						tagMap[tag.METAVALUE] = "";
					});
					setPromptTags(Object.keys(tagMap));
				}
			});
	};

	return (
		<div className="rounded-md border bg-card shadow-sm">
			<div className="flex flex-col">
				{Array.from(promptTags, (category) => (
					<button
						key={category}
						type="button"
						className={`px-4 py-2 text-left capitalize ${
							category === filter
								? "bg-gray-200"
								: "bg-transparent hover:bg-gray-100"
						}`}
						onClick={() => setFilter(category)}
					>
						{category}
					</button>
				))}
			</div>
		</div>
	);
};
