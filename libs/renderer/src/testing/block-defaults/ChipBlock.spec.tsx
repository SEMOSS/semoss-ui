import { render } from "../utils/index";
import { describe, expect, test } from "vitest";
import { fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ChipBlock } from "../../components/block-defaults/chip-block/ChipBlock";

const blocks = {
    "chip": {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
            src: "",
            title: "",
            show: true,
        },
        id: "chip",
        widget: "chip",
        slots: {},
        listeners: {},
    },
    "icon-chip": {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
            src: "",
            title: "",
            show: true,
            type: "Icon",
        },
        id: "icon-chip",
        widget: "chip",
        slots: {},
        listeners: {},
    },
    "appearance-chip": {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
            src: "",
            title: "",
            show: true,
            variant: "outlined",
        },
        id: "appearance-chip",
        widget: "chip",
        slots: {},
        listeners: {},
    },
};


describe("chip block", () => {
    it("should render correctly with mocked provider", async () => {
        const { container } = render(<ChipBlock id="chip" />, {
            blocks: blocks,
        });

        const chip = container.querySelector("[data-block='chip']");
        expect(chip).toBeInTheDocument();
    });

    it("should show correct variant", async () => {
        const { container } = render(<ChipBlock id="icon-chip" />, {
            blocks: blocks,
        });

        const icon = screen.getByTestId("FaceIcon");
        expect(icon).toBeInTheDocument();
    });

    it("should render correct appearance variants", async () => {
        const { container } = render(<ChipBlock id="appearance-chip" />, {
            blocks: blocks,
        });

        const chip = container.querySelector("[data-block='appearance-chip']");
        expect(chip.querySelector(".MuiChip-outlined")).toBeInTheDocument();
    });
});
