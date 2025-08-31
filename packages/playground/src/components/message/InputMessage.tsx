import { observer } from "mobx-react-lite";
import { useInsight } from "@semoss/sdk/react";
import { Avatar, Stack, styled, Typography } from "@semoss/ui";
import type { InputMessageStore, RoomStore } from "@/stores";

const StyledInputMessage = styled(Stack)(({ theme }) => ({
	padding: theme.spacing(2),
	alignSelf: "flex-end",
	display: "inline-flex",
	borderRadius: "8px 8px 0 8px",
	background: "#EBF4FE",
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
	height: "24px",
	width: "24px",
	background: theme.palette.primary.main,
}));

interface InputMessageProps {
	/** Room to render */
	room: RoomStore;

	/** Message to render */
	message: InputMessageStore;
}

export const InputMessage: React.FC<InputMessageProps> = observer(
	({ message }) => {
		const { system } = useInsight();

		const loginType = Object.keys(system.config.logins)[0];
		const userName: string =
			typeof system.config.logins[loginType] === "string"
				? (system.config.logins[loginType] as unknown as string)
				: "";

		const initials: string = userName
			.match(/(\b\S)?/g)
			.join("")
			.match(/(^\S|\S$)?/g)
			.join("")
			.toUpperCase();

		return (
			<StyledInputMessage
				direction={"row"}
				alignItems={"flex-start"}
				spacing={1}
			>
				<StyledAvatar variant="circular">
					<Typography variant="body3">{initials}</Typography>
				</StyledAvatar>
				<Typography variant="body1" sx={{ marginTop: 0.5 }}>
					{message.text}
				</Typography>
			</StyledInputMessage>
		);
	},
);
