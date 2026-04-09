import { observer } from "mobx-react-lite";
import type { ResponseMessageStore } from "@/stores";
import type { PixelMessageMediaPart } from "@/types";

interface ResponseMessageImageProps {
	message: ResponseMessageStore;
	part: PixelMessageMediaPart;
}

export const ResponseMessageImage: React.FC<ResponseMessageImageProps> =
	observer(({ message: _message, part }) => {
		return (
			<div className="inline-block">
				<img
					src={`data:${part.mediaInfo.mimeType || "image/png"};base64,${part.mediaInfo.base64Data}`}
					alt={part.mediaInfo.fileName}
					className="max-h-[512px] max-w-full rounded-lg border border-border object-contain shadow-sm"
				/>
			</div>
		);
	});
