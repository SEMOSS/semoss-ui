import { FileIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import type { InputMessageStore } from "@/stores";
import type { MCP } from "@/types";
import { InputMessageBadge } from "./input-message-badge";

interface InputMessageProps {
	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ message }) => {
		const [selectedImage, setSelectedImage] = useState<
			InputMessageStore["mediaInputs"][number] | null
		>(null);

		return (
			<div>
				<div className="ml-auto max-w-[600px] items-start self-stretch rounded-lg bg-accent px-5 py-4 leading-normal">
					{message.tokens.map((token, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: this is valid as order matters
						<React.Fragment key={index}>
							{token.type === "TEXT" && (
								<span className="text-base text-foreground">
									{token.text}
								</span>
							)}
							{token.type === "DATA" && (
								<InputMessageBadge
									mcp={token.data as unknown as MCP}
								/>
							)}
						</React.Fragment>
					))}
				</div>
				{message.mediaInputs.length > 0 ? (
					<div className="ml-auto flex max-w-[600px] flex-row items-center gap-2 pt-2">
						{message.mediaInputs.map((info) => {
							return (
								<button
									type="button"
									key={`${info.fileName}`}
									className="group relative flex size-22 cursor-pointer flex-row items-center justify-center overflow-hidden border border-border bg-muted"
									onClick={() => setSelectedImage(info)}
									aria-label={`View ${info.fileName}`}
								>
									{info.mimeType.startsWith("image/") ? (
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
				) : null}

				<Dialog
					open={selectedImage !== null}
					onOpenChange={(open) => {
						if (!open) {
							setSelectedImage(null);
						}
					}}
				>
					<DialogContent className="max-w-4xl">
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
								<div className="px-2 py-4 text-center text-muted-foreground text-xs">
									No preview available
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	},
);
