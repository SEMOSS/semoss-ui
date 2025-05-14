import { expect } from "vitest";

import { screen, render } from "../utils";
import { SwitchBlock } from "@/components/block-defaults/switch-block/SwitchBlock";

const blocks = {
    switch: {
        data: {
            style: { width: "fit-content" },
            label: "Toggle Switch",
            value: false,
            disabled: false,
            color: "primary",
            size: "medium",
            helperText: "",
            required: false,
            labelPlacement: "end",
        },
        id: "switch",
        widget: "switch",
        slots: {},
        listeners: {
            preProcess: {
                type: "sync",
                order: [],
            },
            onChange: {
                type: "sync",
                order: [],
            },
        },
    },
    switch2: {
        data: {
            style: { width: "fit-content" },
            label: "Toggle Switch 2",
            value: true,
            disabled: false,
            color: "primary",
            size: "medium",
            helperText: "",
            required: false,
            labelPlacement: "end",
        },
        id: "switch2",
        widget: "switch",
        slots: {},
        listeners: {
            preProcess: {
                type: "sync",
                order: [],
            },
            onChange: {
                type: "sync",
                order: [],
            },
        },
    },
};

describe("switch block", () => {
    it("renders correctly", async () => {
        const { container } = render(<SwitchBlock id="switch" />, {
            blocks: blocks,
        });

        const switchBlock = container.querySelector("[data-block='switch']");
        expect(switchBlock).toBeInTheDocument();
    });

    it("displays default text label", async () => {
        render(<SwitchBlock id="switch" />, {
            blocks: blocks,
        });

        expect(screen.getByText("Toggle Switch")).toBeVisible();
    });

    it("toggles value to true", async () => {
        render(<SwitchBlock id="switch2" />, {
            blocks: blocks,
        });
        const switchElement = screen.getByRole("checkbox");
        const wrapper = switchElement.closest("span");

        expect(wrapper).toHaveClass("Mui-checked");
    });
});
