import { SearchIcon, SquareArrowOutUpRightIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Checkbox,
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	ScrollBar,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { Prompt } from "@/types";
import { promptToPlatformUrl } from "./utility";

interface PromptSelectorProps {
	/** Selected prompt IDs */
	values: string[];

	/** Track if disabled */
	disabled?: boolean;

	/** Callback fired when the selected prompt IDs change */
	onChange: (values: string[]) => void;
}

/**
 * Renders the PromptSelector component for selecting prompts
 */
const PromptSelectorInner: React.FC<PromptSelectorProps> = ({
	values,
	disabled,
	onChange,
}) => {
	const { t } = useTranslation("workspace");
	const [search, setSearch] = useState<string>("");

	const debouncedSearch = useDebouncedValue(search, 500);

	// track selected by id
	const selected = new Set(values);

	/**
	 * Get all of the prompts with lazy loading
	 */
	const getPrompts = useIteratorPixel<Prompt[], Prompt>(
		(limit, offset) =>
			`META | ListPrompt(${debouncedSearch ? `filters=[Filter( (PROMPT__TITLE ?like "${debouncedSearch}") )], ` : ""}limit=[${limit}], offset=[${offset}])`,
		(response) => {
			if (response.length < 25) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response.filter((p) => p.global);
		},
		{
			limit: 25,
		},
		[debouncedSearch],
	);

	/**
	 * Setup infinite scroll for the prompt list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getPrompts.isLoading || !getPrompts.hasMore,
		onNext: () => {
			getPrompts.next();
		},
	});

	/**
	 * Build a lookup of id -> title from loaded data for badge display
	 */
	const titleMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const p of getPrompts.data) {
			map.set(p.id, p.title);
		}
		return map;
	}, [getPrompts.data]);

	/**
	 * Toggle a prompt selection
	 */
	const onSelect = (prompt: Prompt) => {
		if (selected.has(prompt.id)) {
			onChange(values.filter((id) => id !== prompt.id));
		} else {
			onChange([...values, prompt.id]);
		}
	};

	return (
		<div className="w-full overflow-hidden rounded-xl border-border bg-card shadow-sm">
			<div className="flex w-full flex-row gap-2 border-border bg-muted p-4">
				<InputGroup className="bg-background">
					<InputGroupInput
						placeholder={t("prompts.searchPlaceholder")}
						value={search}
						disabled={disabled || getPrompts.isLoading}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>
			</div>

			<ScrollArea
				className="h-64 w-full flex-1"
				viewportRef={(e) => setScroll(e)}
			>
				{getPrompts.isLoading && (
					<div className="flex h-64 w-full items-center justify-center">
						<Spinner />
					</div>
				)}
				{!getPrompts.isLoading && getPrompts.data.length === 0 && (
					<div className="flex h-64 w-full items-center justify-center">
						<Muted>{t("prompts.noPrompts")}</Muted>
					</div>
				)}
				{!getPrompts.isLoading && getPrompts.data.length !== 0 && (
					<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
						{getPrompts.data.map((prompt) => {
							const isSelected = selected.has(prompt.id);

							return (
								<FieldLabel
									key={prompt.id}
									className="col-span-1"
								>
									<Field
										orientation="horizontal"
										className="pb-2!"
									>
										<FieldContent>
											<FieldTitle
												className="line-clamp-1"
												title={prompt.title}
											>
												{prompt.title}
											</FieldTitle>
											{prompt.context && (
												<FieldDescription
													className="line-clamp-2"
													title={prompt.context}
												>
													{prompt.context}
												</FieldDescription>
											)}
										</FieldContent>

										<Checkbox
											className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
											disabled={disabled}
											checked={isSelected}
											onCheckedChange={() => {
												onSelect(prompt);
											}}
										/>
									</Field>
									<div className="flex w-full flex-row justify-end px-4 pb-4">
										<Tooltip>
											<TooltipTrigger asChild>
												<a
													target="_blank"
													href={promptToPlatformUrl(
														prompt,
													)}
												>
													<SquareArrowOutUpRightIcon className="size-4" />
												</a>
											</TooltipTrigger>
											<TooltipContent>
												{t("prompts.viewDetails")}
											</TooltipContent>
										</Tooltip>
									</div>
								</FieldLabel>
							);
						})}
					</div>
				)}
			</ScrollArea>
			{values.length > 0 && (
				<ScrollArea className="w-full whitespace-nowrap">
					<ScrollBar orientation="horizontal" />
					<div className="flex space-x-2 p-4">
						{values.map((id) => {
							const title = titleMap.get(id) || id;
							return (
								<Badge
									key={id}
									variant="secondary"
									className="text-sm"
									title={title}
								>
									<div className="w-32 truncate">{title}</div>
									<Button
										className="ml-1"
										type="button"
										variant="ghost"
										size="icon-sm"
										disabled={disabled}
										onClick={() => {
											onChange(
												values.filter((v) => v !== id),
											);
										}}
									>
										<XIcon />
									</Button>
								</Badge>
							);
						})}
					</div>
				</ScrollArea>
			)}
		</div>
	);
};

export const PromptSelector = observer(PromptSelectorInner);
