import { AudioBlock } from "@/components/block-defaults/audio-block/AudioBlock";
import { render, screen } from "../utils";

const blocks = {
	"audio-player": {
		data: {
			autoplay: false,
			controls: true,
			label: "Audio Player",
			loop: false,
			show: "true",
			source:
				"https://upload.wikimedia.org/wikipedia/commons/6/65/Star_Spangled_Banner_instrumental.ogg",
		},
		id: "audio-player",
		widget: "audio-player",
		listeners: {},
		slots: {},
	},
};

describe("Audio Block", async () => {
	it("Should render the audio block", async () => {
		const { container } = await render(<AudioBlock id="audio-player" />, {
			blocks: blocks,
		});
		const element = screen.getByText("Audio Player");
		expect(element).toBeInTheDocument();
	});
	it("Should hide the audio block", async () => {
		const { container } = await render(<AudioBlock id="audio-player" />, {
			blocks: {
				"audio-player": {
					...blocks["audio-player"],
					data: {
						...blocks["audio-player"].data,
						show: false,
					},
				},
			},
		});
		const element = screen.queryByText("Audio Player");
		expect(element).not.toBeInTheDocument();
	});
	it("Should have an audio source", async () => {
		const { container } = await render(<AudioBlock id="audio-player" />, {
			blocks: {
				"audio-player": {
					...blocks["audio-player"],
					data: {
						...blocks["audio-player"].data,
						source: "hello",
					},
				},
			},
		});
		const element = container.querySelector("audio");

		// screen.debug()

		expect(element).toHaveAttribute("src", "hello");
	});
	it("Should show 'My Audio Test' as custom label", async () => {
		const { container } = await render(<AudioBlock id="audio-player" />, {
			blocks: {
				"audio-player": {
					...blocks["audio-player"],
					data: {
						...blocks["audio-player"].data,
						label: "My Audio Test",
					},
				},
			},
		});
		const element = screen.queryByText("My Audio Test");
		expect(element).toBeInTheDocument();
	});
	it("Should be on loop", async () => {
		const { container } = await render(<AudioBlock id="audio-player" />, {
			blocks: {
				"audio-player": {
					...blocks["audio-player"],
					data: {
						...blocks["audio-player"].data,
						label: "My Audio Test",
						loop: true,
					},
				},
			},
		});
		const element = container.querySelector("audio");
		expect(element).toHaveAttribute("loop");
	});
	it("Should hide controls", async () => {
		const { container } = await render(<AudioBlock id="audio-player" />, {
			blocks: {
				"audio-player": {
					...blocks["audio-player"],
					data: {
						...blocks["audio-player"].data,
						label: "My Audio Test",
						controls: false,
					},
				},
			},
		});
		const element = container.querySelector("audio");
		expect(element).not.toHaveAttribute("controls");
	});
	it("Should be on autoplay", async () => {
		const { container } = await render(<AudioBlock id="audio-player" />, {
			blocks: {
				"audio-player": {
					...blocks["audio-player"],
					data: {
						...blocks["audio-player"].data,
						label: "My Audio Test",
						autoplay: true,
					},
				},
			},
		});
		const element = container.querySelector("audio");
		expect(element).toHaveAttribute("autoplay");
	});
});
