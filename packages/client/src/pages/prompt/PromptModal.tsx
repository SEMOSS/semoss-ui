import { Info, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Switch,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

interface PromptModalProps {
	isOpen: boolean;
	onClose(reload: boolean): void;
	mode: string;
	prompt?: string;
	initialData?: {
		title?: string;
		context?: string;
		intent?: string;
		tags?: string[];
		global?: boolean;
		version?: number;
	};
}

export const PromptModal = (props: PromptModalProps) => {
	const { monolithStore } = useRootStore();
	const { isOpen, onClose, mode, prompt, initialData } = props;
	const [context, setContext] = useState("");
	const [title, setTitle] = useState("");
	const [intent, setIntent] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [global, setGlobal] = useState(true);
	const [tagInput, setTagInput] = useState("");
	const id = useId();

	const addPrompt = () => {
		const promptMap = {
			context: context,
			title: title,
			intent: intent,
			tags: tags,
			global: global,
		};
		const stringified = `AddPrompt ( map = [${JSON.stringify(promptMap)} ])`;
		monolithStore
			.runQuery(stringified)
			.then(() => {
				toast.success("Prompt added successfully");
				onClose(true);
			})
			.catch(() => {
				toast.error("Failed to add prompt");
			});
	};

	const updatePrompt = () => {
		const promptMap = {
			context: context,
			title: title,
			intent: intent,
			tags: tags,
			global: global,
			id: prompt,
		};
		const stringified = `UpdatePrompt ( map = [${JSON.stringify(promptMap)} ])`;
		monolithStore
			.runQuery(stringified)
			.then(() => {
				toast.success("Prompt updated successfully");
				onClose(true);
			})
			.catch(() => {
				toast.error("Failed to update prompt");
			});
	};

	const disableCreate = () => {
		return (
			title === "" || title == null || context === "" || context == null
		);
	};

	const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && tagInput.trim()) {
			e.preventDefault();
			if (!tags.includes(tagInput.trim())) {
				setTags([...tags, tagInput.trim()]);
			}
			setTagInput("");
		} else if (
			e.key === "Backspace" &&
			tagInput === "" &&
			tags.length > 0
		) {
			setTags(tags.slice(0, -1));
		}
	};

	const removeTag = (tagToRemove: string) => {
		setTags(tags.filter((t) => t !== tagToRemove));
	};

	useEffect(() => {
		if (initialData) {
			setTitle(initialData.title || "");
			setContext(initialData.context || "");
			setIntent(initialData.intent || "");
			setTags(initialData.tags || []);
			setGlobal(initialData.global ?? true);
		} else {
			setTitle("");
			setContext("");
			setIntent("");
			setTags([]);
			setGlobal(true);
		}
		setTagInput("");
	}, [initialData]);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose(false);
			}}
		>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{mode} Prompt</DialogTitle>
					{mode === "Edit" && initialData?.version != null && (
						<DialogDescription>
							Editing version {initialData.version + 1}. Saving
							will create a new version.
						</DialogDescription>
					)}
				</DialogHeader>

				<div className="flex flex-col gap-5 py-4">
					{/* Prompt Title */}
					<div className="flex flex-col gap-2">
						<Label htmlFor={`${id}-title`}>Prompt Title</Label>
						<Input
							id={`${id}-title`}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter prompt title"
						/>
					</div>

					{/* Description */}
					<div className="flex flex-col gap-2">
						<Label htmlFor={`${id}-description`}>Description</Label>
						<Input
							id={`${id}-description`}
							value={intent}
							onChange={(e) => setIntent(e.target.value)}
							placeholder="Enter description"
						/>
					</div>

					{/* Prompt Context */}
					<div className="flex flex-col gap-2">
						<Label htmlFor={`${id}-context`}>Prompt Context</Label>
						<Textarea
							id={`${id}-context`}
							value={context}
							onChange={(e) => setContext(e.target.value)}
							rows={4}
							placeholder="Enter prompt context"
						/>
					</div>

					{/* Tags */}
					<div className="flex flex-col gap-2">
						<Label>Tags</Label>
						<div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
							{tags.map((tag) => (
								<Badge
									key={tag}
									variant="secondary"
									className="gap-1"
								>
									{tag}
									<button
										type="button"
										className="rounded-full outline-none hover:bg-muted"
										onClick={() => removeTag(tag)}
									>
										<X className="size-3" />
									</button>
								</Badge>
							))}
							<input
								className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								onKeyDown={handleTagKeyDown}
								placeholder='Press "Enter" to add tag'
							/>
						</div>
					</div>

					{/* Global Toggle */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Label htmlFor={`${id}-global`}>Global</Label>
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className="size-4 cursor-help text-muted-foreground" />
								</TooltipTrigger>
								<TooltipContent>
									Allow prompt to be seen by all users
								</TooltipContent>
							</Tooltip>
						</div>
						<Switch
							id={`${id}-global`}
							checked={global}
							onCheckedChange={setGlobal}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onClose(false)}
						data-testid="promptModal-cancel-btn"
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={() => {
							if (mode === "Edit") {
								updatePrompt();
							} else {
								addPrompt();
							}
						}}
						disabled={disableCreate()}
						data-testid="promptModal-save-btn"
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
