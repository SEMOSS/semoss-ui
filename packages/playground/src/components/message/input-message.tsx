import { observer } from "mobx-react-lite";
import type { InputMessageStore } from "@/stores";

interface InputMessageProps {
	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ message }) => {
		return (
			<>
				<div className="ml-auto max-w-[600px] items-start self-stretch rounded-lg bg-accent px-5 py-4 leading-normal">
					<span className="text-base text-foreground">
						{message.text}
					</span>
				</div>
				{message.imageInfos.length > 0 ? (
					<div className="ml-auto flex max-w-[600px] flex-row items-center gap-2 pt-4">
						{message.imageInfos.map((info) => {
							return (
								<div
									key={`${info.fileName}`}
									className="group relative flex size-22 cursor-pointer flex-row items-center justify-center overflow-hidden border border-border"
								>
									<img
										className="width-100"
										src={`data:image/png;base64,${info.base64Data}`}
										alt={info.fileName}
									/>
								</div>
							);
						})}
					</div>
				) : null}
			</>
		);
	},
);
