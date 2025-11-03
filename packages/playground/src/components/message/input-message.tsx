import { observer } from "mobx-react-lite";
import type { InputMessageStore } from "@/stores";

interface InputMessageProps {
	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ message }) => {
		return (
			<div className="ml-auto max-w-[600px] items-start self-stretch rounded-md bg-blue-50 px-3 py-2 leading-normal">
				<span className="text-base text-primary">{message.text}</span>
			</div>
		);
	},
);
