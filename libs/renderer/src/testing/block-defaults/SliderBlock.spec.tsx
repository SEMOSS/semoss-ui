import { expect, vi } from "vitest";
import { SliderBlock } from "../../components/block-defaults/slider-block/SliderBlock";
import { render } from "../utils";

// Radix Slider uses ResizeObserver internally
class ResizeObserverMock {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const blocks = {
	slider: {
		data: {
			type: "continuous",
			style: {
				color: "primary",
			},
			marks: [],
			steps: 1,
			value: 50,
			min: 0,
			max: 100,
			size: "300px",
		},
		id: "slider",
		widget: "slider",
		slots: {
			children: {
				children: [],
				name: "",
			},
		},
		listeners: {
			onChange: [],
		},
	},
	slider2: {
		data: {
			type: "discrete",
			style: {
				color: "primary",
			},
			marks: [{ display: "40", value: 40 }],
			steps: 1,
			value: 50,
			min: 0,
			max: 100,
			size: "300px",
		},
		id: "slider2",
		widget: "slider",
		slots: {
			children: {
				children: [],
				name: "",
			},
		},
		listeners: {
			onChange: [],
		},
	},
};

describe("slider block", () => {
	it("renders correctly with mocked provider", async () => {
		const { container } = render(<SliderBlock id={blocks.slider.id} />, {
			blocks: blocks,
		});

		const sliderElement = container.querySelector(
			"[data-block='slider'] [role='slider']",
		);

		expect(sliderElement).toBeInTheDocument();
		expect(sliderElement).toHaveAttribute("aria-valuenow", "50");
	});

	it("renders discrete correctly with mocked provider", async () => {
		const { container } = render(<SliderBlock id={blocks.slider2.id} />, {
			blocks: blocks,
		});

		const sliderElement = container.querySelector(
			"[data-block='slider2'] [role='slider']",
		);

		expect(sliderElement).toBeInTheDocument();
		expect(sliderElement).toHaveAttribute("aria-valuenow", "50");
		expect(sliderElement).toHaveAttribute("aria-valuemin", "0");
		expect(sliderElement).toHaveAttribute("aria-valuemax", "100");
	});
});
