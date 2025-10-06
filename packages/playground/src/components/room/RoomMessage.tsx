import { observer } from "mobx-react-lite";
import { InputMessage, ResponseMessage } from "@/components";
import type { InputMessageStore, ResponseMessageStore } from "@/stores";

interface RoomMessageProps {
	/** Message to render */
	message: InputMessageStore | ResponseMessageStore;
}

export const RoomMessage: React.FC<RoomMessageProps> = observer(
	({ message }) => {
		if (message.type === "INPUT") {
			return <InputMessage message={message} />;
		} else if (message.type === "RESPONSE") {
			return <ResponseMessage message={message} />;
		}
	},
);
