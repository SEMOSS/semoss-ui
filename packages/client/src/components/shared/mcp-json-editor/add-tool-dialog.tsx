import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Textarea,
} from "@semoss/ui/next";
import {
	type NewToolInput,
	slugifyIdentifier,
	validateIdentifier,
} from "./mcp-json-utils";

export interface AddToolDialogProps {
	open: boolean;

	/** Names already used in this file, so a duplicate is caught before it lands */
	takenNames: Set<string>;

	/**
	 * Implementation kind the new tool will get, e.g. "python". Shown so it is
	 * clear the tool still needs a backing function to do anything.
	 */
	toolType?: string;

	onOpenChange: (open: boolean) => void;
	onCreate: (input: NewToolInput) => void;
}

/**
 * Collects the minimum a tool needs to be functional: a unique name and the
 * backing function it calls. A tool created without a backing function is
 * allowed but flagged, since it will not execute.
 */
export const AddToolDialog = ({
	open,
	takenNames,
	toolType,
	onOpenChange,
	onCreate,
}: AddToolDialogProps) => {
	const nameId = useId();
	const titleId = useId();
	const functionId = useId();
	const descriptionId = useId();

	const [name, setName] = useState("");
	const [title, setTitle] = useState("");
	const [functionName, setFunctionName] = useState("");
	const [description, setDescription] = useState("");
	const [error, setError] = useState<string | undefined>();
	/** Once the name is edited by hand it stops tracking the title. */
	const [nameEdited, setNameEdited] = useState(false);

	useEffect(() => {
		if (!open) return;
		setName("");
		setTitle("");
		setFunctionName("");
		setDescription("");
		setError(undefined);
		setNameEdited(false);
	}, [open]);

	const handleTitleChange = useCallback(
		(value: string) => {
			setTitle(value);
			if (nameEdited) return;
			setName(slugifyIdentifier(value));
			setError(undefined);
		},
		[nameEdited],
	);

	const handleCreate = useCallback(() => {
		// Spaces and punctuation are folded into underscores rather than
		// rejected, since the provider would refuse the name either way.
		const slug = slugifyIdentifier(name);
		const validation = validateIdentifier(slug, takenNames, "Tool name");
		if (validation) {
			setName(slug);
			setError(validation);
			return;
		}

		onCreate({
			name: slug,
			title,
			description,
			functionName: slugifyIdentifier(functionName) || slug,
		});
		onOpenChange(false);
	}, [
		name,
		title,
		description,
		functionName,
		takenNames,
		onCreate,
		onOpenChange,
	]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add tool</DialogTitle>
					<DialogDescription>
						Creates a new entry in this file. Parameters can be
						added once the tool exists.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1">
						<Label
							htmlFor={titleId}
							className="text-muted-foreground text-xs"
						>
							Display title
						</Label>
						<Input
							id={titleId}
							value={title}
							onChange={(e) => handleTitleChange(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleCreate();
								}
							}}
							placeholder="Get Bank Statement"
							className="text-foreground text-sm"
						/>
						<span className="text-muted-foreground text-xs">
							Shown to people in chat. Spaces are fine here.
						</span>
					</div>

					<div className="flex flex-col gap-1">
						<Label
							htmlFor={nameId}
							className="text-muted-foreground text-xs"
						>
							Tool name
						</Label>
						<Input
							id={nameId}
							value={name}
							onChange={(e) => {
								setNameEdited(true);
								setName(e.target.value);
								setError(undefined);
							}}
							onBlur={() => setName(slugifyIdentifier(name))}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleCreate();
								}
							}}
							placeholder="get_bank_statement"
							className={`font-mono text-foreground text-sm ${
								error ? "border-destructive" : ""
							}`}
						/>
						{error ? (
							<span className="flex items-center gap-1 text-destructive text-xs">
								<AlertCircle
									size={12}
									className="flex-shrink-0"
								/>
								{error}
							</span>
						) : (
							<span className="text-muted-foreground text-xs">
								The identifier the agent calls. Follows the
								title until you edit it; spaces become
								underscores.
							</span>
						)}
					</div>

					<div className="flex flex-col gap-1">
						<Label
							htmlFor={functionId}
							className="text-muted-foreground text-xs"
						>
							Backing function
						</Label>
						<Input
							id={functionId}
							value={functionName}
							onChange={(e) => setFunctionName(e.target.value)}
							placeholder="Defaults to the tool name"
							className="font-mono text-foreground text-sm"
						/>
						<span className="text-muted-foreground text-xs">
							{toolType === "python"
								? "The Python function this tool calls. It must already exist in the project."
								: "The implementation this tool calls. It must already exist in the project."}
						</span>
					</div>

					<div className="flex flex-col gap-1">
						<Label
							htmlFor={descriptionId}
							className="text-muted-foreground text-xs"
						>
							Description
						</Label>
						<Textarea
							id={descriptionId}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder="Describe what this tool does and when the agent should reach for it..."
							className="resize-y text-foreground text-sm"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button onClick={handleCreate}>Add tool</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
