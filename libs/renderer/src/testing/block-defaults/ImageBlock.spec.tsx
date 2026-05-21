import { expect } from "vitest";
import {
	ImageBlock,
	type ImageBlockDef,
} from "../../components/block-defaults/image-block/ImageBlock";
import { useBlock } from "../../hooks";
import { render, renderHook } from "../utils";

const blocks = {
	image: {
		data: {
			src: "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg",
			title: "image test",
			show: "true",
			style: {
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				height: "200px",
				backgroundSize: "contain",
				backgroundRepeat: "no-repeat",
				backgroundPosition: "center center",
			},
		},
		id: "image",
		widget: "image",
		slots: {},
		listeners: {},
	},
	image2: {
		data: {
			src: "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg",
			title: "image test",
			show: "false",
		},
		id: "image2",
		widget: "image",
		slots: {},
		listeners: {},
	},
};

describe("Image Block", () => {
	it("renders correctly", async () => {
		const { result } = renderHook(() => useBlock<ImageBlockDef>("image"), {
			blocks,
			renderEngineId: "image",
		});

		const image = result.current.data.src;
		expect(image).toBeDefined();
	});
	it("does not show", async () => {
		const { container } = render(<ImageBlock id={blocks.image2.id} />, {
			blocks: blocks,
		});

		const element = container.querySelector(
			"[data-block='image2']",
		) as HTMLElement;
		expect(element).not.toBeNull();
		expect(element.getAttribute("style")).toBeNull();
	});
});
