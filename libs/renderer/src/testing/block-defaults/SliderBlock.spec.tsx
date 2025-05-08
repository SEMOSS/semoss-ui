import { expect } from "vitest";
import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "../utils";
import { SliderBlock } from "@/components/block-defaults/slider-block/SliderBlock";

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
        const { container } = render(<SliderBlock id="slider" />, {
            blocks: blocks,
        });

        const buttonElement = container.querySelector(
            "[data-block='slider'] input",
        );

        expect(buttonElement).toBeInTheDocument();
        expect(screen.getByText("50")).toBeInTheDocument();
    });

    it("renders discrete correctly with mocked provider", async () => {
        const { container } = render(<SliderBlock id="slider2" />, {
            blocks: blocks,
        });

        const markElement = container.querySelector("[style='left: 40%;']");

        expect(markElement).toBeInTheDocument();
        expect(screen.getByText("40")).toBeInTheDocument();
        expect(screen.getByText("50")).toBeInTheDocument();
    });
});
