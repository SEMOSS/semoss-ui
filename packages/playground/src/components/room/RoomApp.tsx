import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
	CircularProgress,
	Stack,
	Typography,
	useNotification,
} from "@semoss/ui";
import { RightMenu } from "@/components";
import type { ChatRoom } from "@/stores";

interface RoomAppProps {
	/** Room to render */
	room: ChatRoom;
}

export const RoomApp: React.FC<RoomAppProps> = observer((props) => {
	// set the get the room based on the params
	const { room } = props;

	const notification = useNotification();

	// TODO: clean-up
	const options =
		room.sidebar.options.type === "APP" ? room.sidebar.options : null;

	const [url, setUrl] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		const handleMessage = async (
			event: MessageEvent<{ data: Record<string, unknown> }>,
		) => {
			try {
				await room.processAppResponse();
			} catch (e) {
				notification.add({
					message: e.message,
					color: "error",
				});
			}

			room.closeSidebar();
		};

		// TODO: Env specific
		// let url = `http://localhost:9090/SemossWeb/packages/client/dist/#/s/${response.id}`;
		let url = `../../client/dist/#/s/${options.toolId}`;

		const params = [];
		for (const [key, value] of Object.entries(options.toolParameters)) {
			if (typeof value !== "undefined") {
				params.push(`${key}=${value}`);
			}
		}

		if (params.length > 0) {
			url += `?${params.concat("&")}`;
		}

		setUrl(url);

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [options, room.processAppResponse, room.closeSidebar, notification.add]);

	if (!options) {
		return;
	}

	return (
		<RightMenu
			mode={"fixed"}
			header={
				<Typography
					variant={"body1"}
					fontWeight={"bold"}
					noWrap={true}
					sx={{
						flex: 1,
					}}
				>
					{options.toolName}
				</Typography>
			}
			onClose={() => room.closeSidebar()}
		>
			{loading && (
				<Stack
					alignItems={"center"}
					justifyContent={"center"}
					height={"100%"}
					width={"100%"}
				>
					<CircularProgress color={"info"} />
				</Stack>
			)}
			<iframe
				src={url}
				frameBorder="0"
				style={{
					width: "100%",
					height: "100%",
				}}
				onLoad={() => setLoading(false)}
			></iframe>
		</RightMenu>
	);
});
