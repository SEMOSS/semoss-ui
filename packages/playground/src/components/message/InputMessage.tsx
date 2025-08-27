import { observer } from "mobx-react-lite";
import { useInsight } from "@semoss/sdk/react";
import { Avatar, Stack, styled, Typography } from "@semoss/ui";
import type { InputMessageStore, RoomStore } from "@/stores";

const StyledUserMessage = styled(Stack)(({ theme }) => ({
	padding: theme.spacing(2),
	borderRadius: theme.shape.borderRadius,
	background: theme.palette.background.default,
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
	fontSize: "14px",
	fontWeight: 400,
	letterSpacing: ".1px",
	lineHeight: "48px",
	height: theme.spacing(4),
	width: theme.spacing(4),
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
			<StyledUserMessage
				direction={"row"}
				alignItems={"flex-start"}
				spacing={1}
			>
				<StyledAvatar>{initials}</StyledAvatar>
				<Typography variant="body1" sx={{ marginTop: 0.5 }}>
					{message.text}
				</Typography>
			</StyledUserMessage>
		);
	},
);
