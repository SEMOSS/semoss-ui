import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { styled } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

const StyledLabel = styled("span")(({ theme }) => ({
	marginBottom: theme.spacing(0.5),
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	justifyContent: "center",
	gap: theme.spacing(0.5),
}));

export interface AudioBlockDef extends BlockDef<"audio-player"> {
	widget: "audio-player";
	data: {
		label: string;
		autoplay: boolean;
		controls: boolean;
		loop: boolean;
		source: string;
		show: string;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

const StyledContainer = styled("div")(({ theme }) => ({
	padding: theme.spacing(0.5),
}));

export const AudioBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<AudioBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	return (
		<StyledContainer {...attrs}>
			<StyledLabel>{data.label}</StyledLabel>
			<audio
				controls={data.controls}
				autoPlay={data.autoplay}
				loop={data.loop}
				src={data.source}
			>
				<track kind="captions" />
			</audio>
		</StyledContainer>
	);
});
