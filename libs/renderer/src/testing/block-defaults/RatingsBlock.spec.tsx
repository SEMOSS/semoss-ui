import {
	RatingsBlock,
	type RatingsBlockDef,
} from "../../components/block-defaults/ratings-block";
import { useBlock } from "../../hooks";
import { render, renderHook } from "../utils";

const blocks = {
	ratings: {
		data: {
			style: {},
			size: "small",
			type: "star",
			value: 3,
			max: 5,
		},
		id: "ratings",
		widget: "ratings",
		listeners: {
			onChange: [],
		},
		slots: {},
	},
	"ratings-hearts": {
		data: {
			style: {},
			size: "small",
			type: "heart",
			value: 3,
			max: 5,
		},
		id: "ratings-hearts",
		widget: "ratings",
		listeners: {
			onChange: [],
		},
		slots: {},
	},
};

describe("ratings block", async () => {
	it("should render ratings block", async () => {
		const { container } = await render(
			<RatingsBlock id={blocks.ratings.id} />,
			{
				blocks: blocks,
			},
		);
		const element = container.querySelector("[data-block='ratings']");
		expect(element).toBeInTheDocument();
	});

	it("should have value", async () => {
		const { result } = renderHook(
			() => useBlock<RatingsBlockDef>("ratings"),
			{ blocks, renderEngineId: "ratings" },
		);

		expect(result.current.data.value).toBe(3);
	});

	it("should render correct icon", async () => {
		const { container } = await render(
			<RatingsBlock id={blocks["ratings-hearts"].id} />,
			{
				blocks: blocks,
			},
		);
		const heartIcon = container.querySelector(
			"[data-testid='FavoriteIcon']",
		);
		expect(heartIcon).toBeInTheDocument();
		const starIcon = container.querySelector("[data-testid='StarIcon']");
		expect(starIcon).not.toBeInTheDocument();
	});
});
