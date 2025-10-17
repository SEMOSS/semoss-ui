import { observer } from "mobx-react-lite";
import type { InputMessageStore } from "@/stores";

interface InputMessageProps {
	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ message }) => {
		return (
			<div className="wrap-anywhere ml-[10%] flex-row items-start self-end rounded-t-md rounded-bl-md bg-sidebar-primary-foreground p-3 text-base text-foreground shadow-sm dark:text-background">
				{message.text}
			</div>
		);
	},
);
