import { observer } from "mobx-react-lite";
import type { InputMessageStore } from "@/stores";

interface InputMessageProps {
	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ message }) => {
		return (
			<div className="inline-flex flex-row items-start self-end rounded-t-md rounded-bl-md bg-sidebar-primary-foreground p-3 text-secondary shadow-sm">
				<div className="text-sm">{message.text}</div>
			</div>
		);
	},
);
