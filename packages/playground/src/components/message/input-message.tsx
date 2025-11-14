import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import type { InputMessageStore } from "@/stores";

interface InputMessageProps {
	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ message }) => {
		const [selectedImage, setSelectedImage] = useState<
			InputMessageStore["imageInfos"][number] | null
		>(null);

		return (
			<div>
				<div className="ml-auto max-w-[600px] items-start self-stretch rounded-lg bg-accent px-5 py-4 leading-normal">
					<span className="text-base text-foreground">
						{message.text}
					</span>
				</div>
				{message.imageInfos.length > 0 ? (
					<div className="ml-auto flex max-w-[600px] flex-row items-center gap-2 pt-2">
						{message.imageInfos.map((info) => {
							return (
								<button
									type="button"
									key={`${info.fileName}`}
									className="group relative flex size-22 cursor-pointer flex-row items-center justify-center overflow-hidden border border-border"
									onClick={() => setSelectedImage(info)}
									aria-label={`View ${info.fileName}`}
								>
									<img
										className="width-100"
										src={`data:image/png;base64,${info.base64Data}`}
										alt={info.fileName}
									/>
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
							{selectedImage?.base64Data && (
								<img
									src={`data:image/png;base64,${selectedImage.base64Data}`}
									alt={selectedImage.fileName || "Image"}
									className="max-h-[70vh] max-w-full object-contain"
								/>
							)}
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	},
);
