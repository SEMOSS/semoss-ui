import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import { AudioBlock, type AudioBlockDef } from "./AudioBlock";

// export the config for the block
export const config: BlockConfig<AudioBlockDef> = {
	widget: "audio-player",
	type: BLOCK_TYPE_ACTION,
	data: {
		label: "Audio Player",
		autoplay: false,
		controls: true,
		loop: false,
		source: "",
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: AudioBlock,
};
