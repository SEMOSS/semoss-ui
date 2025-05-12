import { render, screen } from "../utils";
import { fireEvent } from "@testing-library/react";

import { RatingsBlock } from "@/components/block-defaults/ratings-block";

const blocks = {
    "ratings": {
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
        // const { container } = await render(<RatingsBlock id="ratings"/>, {
        //     blocks: blocks,
        // });
        
        // const element = container.querySelector("[data-block='ratings']");
        // expect(element).toBeInTheDocument();
    });

    // it("should change rating when clicked", async () => {
    //     const { container } = await render(<RatingsBlock id="ratings"/>, {
    //         blocks: blocks,
    //     });

    //     const oneStar = screen.getByText("1 Star").parentElement;
    //     const twoStar = screen.getByText("2 Stars").parentElement; 

    //     // second star should be filled before click, and empty after
    //     expect(twoStar.querySelector(".MuiRating-iconFilled")).toBeInTheDocument();
    //     fireEvent.click(oneStar);
    //     expect(twoStar.querySelector(".MuiRating-iconEmpty")).toBeInTheDocument();
    // });

    // it("should render correct icon", async () => {
    //     const { container } = await render(<RatingsBlock id="ratings-hearts"/>, {
    //         blocks: blocks,
    //     });

    //     const heartIcon = container.querySelector("[data-testid='FavoriteIcon']");
    //     expect(heartIcon).toBeInTheDocument();
    //     const starIcon = container.querySelector("[data-testid='StarIcon']");
    //     expect(starIcon).not.toBeInTheDocument();
    // });
});