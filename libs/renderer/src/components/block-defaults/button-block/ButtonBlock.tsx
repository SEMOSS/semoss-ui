import { Button, CircularProgress, styled } from "@mui/material";
import { observer } from "mobx-react-lite";
import { CSSProperties, useEffect } from "react";
import { oauth } from "@semoss/sdk/react";
import { useNotification } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import { BlockComponent, BlockDef, ListenerActions } from "../../../store";

const StyledButton = styled(Button, {
	shouldForwardProp: (prop) => prop !== "loading",
})<{ loading?: boolean }>(({ loading }) => ({
	"& .MuiButton-endIcon svg": {
		visibility: loading === true ? "hidden" : "visible",
	},
	"& .MuiButton-startIcon svg": {
		visibility: loading === true ? "hidden" : "visible",
	},
}));

const StyledLabel = styled("span", {
	shouldForwardProp: (prop) => prop !== "loading",
})<{ loading?: boolean }>(({ loading }) => ({
	visibility: loading ? "hidden" : "visible",
}));

const StyledCircularProgress = styled(CircularProgress)({
	zIndex: 10,
	position: "absolute",
});

export interface ButtonBlockDef extends BlockDef<"button"> {
	widget: "button";
	data: {
		style: CSSProperties;
		label: string;
		loading?: boolean;
		disabled?: boolean;
		variant: "contained" | "outlined" | "text";
		color: "primary" | "secondary" | "success" | "warning" | "error";
		show: string;
		type: "button" | "submit" | "reset" | "login";
	};
	listeners: {
		onClick: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

const StyledContainer = styled("div")(({ theme }) => ({
	padding: "4px",
}));

export const ButtonBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<ButtonBlockDef>(id);
	const notification = useNotification();

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const Login = async () => {
		try {
			const response = await oauth("google");
			if (response.name) {
				notification.add({
					color: "success",
					message: "Successfully logged into Google",
				});
			} else {
				notification.add({
					color: "error",
					message: "Failed to fetch Google user info",
				});
			}
		} catch (error) {
			notification.add({
				color: "error",
				message: error.message,
			});
		}
	};

	return (
		<StyledContainer {...attrs}>
			<StyledButton
				size="medium"
				color={data.color}
				variant={data.variant}
				loading={data?.loading}
				disabled={data?.disabled || data?.loading}
				type={
					(["button", "submit", "reset"].includes(data.type)
						? data.type
						: "button") as "button" | "submit" | "reset"
				}
				sx={{
					...data.style,
				}}
				onClick={() => {
					if (data.type === "login") {
						Login();
					} else {
						listeners.onClick();
					}
				}}
			>
				<StyledLabel loading={data?.loading}>{data.label}</StyledLabel>
				{data.loading ? (
					<StyledCircularProgress color="inherit" size="2em" />
				) : (
					<></>
				)}
			</StyledButton>
		</StyledContainer>
	);
});
