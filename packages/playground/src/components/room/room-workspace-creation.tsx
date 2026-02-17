import { PackagePlus } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useId, useState } from "react";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";
import type { MCPConfig } from "@/types";

interface SaveWorkspaceDialogProps {
	/** System prompt/instructions to save */
	systemPrompt: string;
	/** MCPs to save (should be filtered to exclude workspace MCPs) */
	mcps: MCPConfig[];
}

export const SaveWorkspaceDialog = observer(
	(props: SaveWorkspaceDialogProps) => {
		const { systemPrompt, mcps } = props;

		/**
		 * Library hooks
		 */
		const { chat } = useChat();
		const nameId = useId();
		const descriptionId = useId();

		/**
		 * State
		 */
		const [isOpen, setIsOpen] = useState(false);
		const [name, setName] = useState("");
		const [description, setDescription] = useState("");
		const [isLoading, setIsLoading] = useState(false);

		/**
		 * Handlers
		 */
		const handleSave = async () => {
			if (!name.trim()) {
				toast.error("Agent name is required");
				return;
			}

			setIsLoading(true);

			try {
				await chat.addWorkspace({
					name,
					description,
					system_prompt: systemPrompt,
					mcp: mcps,
				});

				toast.success("Agent created successfully");

				// Reset and close
				setIsOpen(false);
				setName("");
				setDescription("");
			} catch (error) {
				toast.error(
					`Failed to create agent: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			} finally {
				setIsLoading(false);
			}
		};

		const handleCancel = () => {
			setIsOpen(false);
			setName("");
			setDescription("");
		};

		return (
			<>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								setIsOpen(true);
							}}
						>
							<PackagePlus />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Publish as Agent</TooltipContent>
				</Tooltip>

				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Publish Agent</DialogTitle>
							<DialogDescription>
								Publish a new agent with the current room
								configuration, including instructions and MCPs.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor={nameId}>Name *</Label>
								<Input
									id={nameId}
									placeholder="Enter agent name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									disabled={isLoading}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={descriptionId}>
									Description
								</Label>
								<Textarea
									id={descriptionId}
									placeholder="Enter agent description"
									value={description}
									onChange={(e) =>
										setDescription(e.target.value)
									}
									disabled={isLoading}
									rows={3}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={handleCancel}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button onClick={handleSave} disabled={isLoading}>
								{isLoading ? "Publishing..." : "Publish Agent"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	},
);
