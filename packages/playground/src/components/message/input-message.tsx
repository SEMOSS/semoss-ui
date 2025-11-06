import { observer } from "mobx-react-lite";
import type { InputMessageStore } from "@/stores";

interface InputMessageProps {
	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ message }) => {
		return (
			<div className="ml-auto max-w-[600px] items-start self-stretch rounded-lg bg-accent px-5 py-4 leading-normal">
				<span className="text-base text-foreground">
					{message.text}
				</span>
			</div>
		);
	},
);
