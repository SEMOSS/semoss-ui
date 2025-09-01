import { observer } from "mobx-react-lite";
import { InputMessage, ResponseMessage } from "@/components";
import type {
	InputMessageStore,
	ResponseMessageStore,
	RoomStore,
} from "@/stores";

interface RoomMessageProps {
	/** Room to render */
	room: RoomStore;

	/** Message to render */
	message: InputMessageStore | ResponseMessageStore;
}

export const RoomMessage: React.FC<RoomMessageProps> = observer(
	({ room, message }) => {
		if (message.type === "INPUT") {
			return <InputMessage room={room} message={message} />;
		} else if (message.type === "RESPONSE") {
			return <ResponseMessage room={room} message={message} />;
		}
	},
);
