import { CopyIcon, FileIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Muted,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { InputMessageStore } from "@/stores";

interface InputMessageProps {
	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ message }) => {
		const [selectedImage, setSelectedImage] = useState<
			InputMessageStore["mediaInputs"][number] | null
		>(null);

		/**
		 * Copy the text
		 * @param text - text to copy
		 */
		const copyMessage = (text: string) => {
			try {
				navigator.clipboard.writeText(text);

				toast.success("Successfully copied to clipboard");
			} catch (e) {
				toast.error(e.message);
			}
		};

		return (
			<div className="group">
				<div className="ml-auto max-w-[600px] items-start self-stretch rounded-lg bg-accent px-5 py-4 leading-normal">
					<span className="text-base text-foreground">
						{message.text}
					</span>
					{message.mediaInputs.length > 0 && (
						<div className="flex flex-row items-center justify-start gap-2 pt-3">
							{message.mediaInputs.map((info) => {
								return (
									<button
										type="button"
										key={`${info.fileName}`}
										className="group relative flex size-22 cursor-pointer flex-row items-center justify-center overflow-hidden rounded-md border border-border bg-muted"
										onClick={() => setSelectedImage(info)}
										aria-label={`View ${info.fileName}`}
									>
										{info.mimeType?.startsWith("image/") ? (
											<img
												className="w-full"
												src={`data:image/png;base64,${info.base64Data}`}
												alt={info.fileName}
											/>
										) : (
											<FileIcon className="size-6 text-muted-foreground" />
										)}
									</button>
								);
							})}
						</div>
					)}
				</div>
				<div className="ml-auto flex max-w-[600px] justify-end pt-2 opacity-0 transition-opacity group-hover:opacity-100">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								disabled={!message.text}
								onClick={() => {
									if (!message.text) {
										return;
									}

									copyMessage(message.text);
								}}
							>
								<CopyIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							Copy Message
						</TooltipContent>
					</Tooltip>
				</div>
				<Dialog
					open={selectedImage !== null}
					onOpenChange={(open) => {
						if (!open) {
							setSelectedImage(null);
						}
					}}
				>
					<DialogContent className="sm:max-w-4xl">
						<DialogHeader>
							<DialogTitle>
								{selectedImage?.fileName || "Image"}
							</DialogTitle>
						</DialogHeader>
						<div className="flex items-center justify-center">
							{selectedImage?.mimeType.startsWith("image/") ? (
								<img
									src={`data:image/png;base64,${selectedImage.base64Data}`}
									alt={selectedImage.fileName || "Image"}
									className="max-h-[70vh] max-w-full object-contain"
								/>
							) : (
								<div className="px-2 py-4 text-center">
									<Muted>No preview available</Muted>
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	},
);
