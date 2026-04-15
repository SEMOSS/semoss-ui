import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

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

export const AudioBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<AudioBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	return (
		<div {...attrs} className="p-1">
			<span className="mb-1 flex flex-col items-start justify-center gap-1">
				{data.label}
			</span>
			<audio
				controls={data.controls}
				autoPlay={data.autoplay}
				loop={data.loop}
				src={data.source}
			>
				<track kind="captions" />
			</audio>
		</div>
	);
});
