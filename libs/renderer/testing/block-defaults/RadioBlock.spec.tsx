import { expect } from "vitest";

import { render, screen } from "../utils";
import { RadioBlock } from "@/components/block-defaults/radio-block/RadioBlock";

const blocks = {
    radio: {
        data: {
            style: {
                padding: "4px",
            },
            label: "Radio test",
            options: [{ label: "Radio choice 1", value: "radioChoice1" }],
            size: "medium",
            direction: "row",
            color: "primary",
            labelPlacement: "end",
            required: false,
            disabled: false,
            show: "true",
        },
        id: "radio",
        widget: "radio",
        slots: {
            content: [],
        },
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
    radio2: {
        data: {
            style: {
                padding: "4px",
            },
            label: "Radio test 2",
            options: [{ label: "Radio choice 2", value: "radioChoice2" }],
            size: "medium",
            direction: "row",
            color: "primary",
            labelPlacement: "end",
            required: false,
            disabled: true,
            show: "true",
        },
        id: "radio2",
        widget: "radio",
        slots: {
            content: [],
        },
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
    radio3: {
        data: {
            style: {
                padding: "4px",
            },
            label: "Radio test 3",
            options: [{ label: "Radio choice 3", value: "radioChoice3" }],
            size: "medium",
            direction: "row",
            color: "primary",
            labelPlacement: "end",
            required: true,
            disabled: false,
            show: "true",
        },
        id: "radio3",
        widget: "radio",
        slots: {
            content: [],
        },
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
    radio4: {
        data: {
            style: {
                padding: "4px",
            },
            label: "Radio test 4",
            options: [
                { label: "Radio choice 4", value: "radioChoice4" },
                { label: "Radio choice 5", value: "radioChoice5" },
            ],
            size: "medium",
            direction: "row",
            color: "primary",
            labelPlacement: "end",
            required: true,
            disabled: false,
            show: "true",
            value: "radioChoice5",
        },
        id: "radio4",
        widget: "radio",
        slots: {
            content: [],
        },
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

describe("radio block", () => {
    it("renders correctly", async () => {
        const { container } = render(<RadioBlock id="radio" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='radio']");
        expect(element).toBeInTheDocument();

        const radioOption1 = screen.getByRole("radio", {
            name: "Radio choice 1",
        });
        expect(radioOption1).toBeInTheDocument();
    });

    it("renders disabled correctly", async () => {
        render(<RadioBlock id="radio2" />, {
            blocks: blocks,
        });

        const radioOption2 = screen.getByRole("radio", {
            name: "Radio choice 2",
        });
        expect(radioOption2).toBeDisabled();
    });

    it("renders required correctly", async () => {
        render(<RadioBlock id="radio3" />, {
            blocks: blocks,
        });

        const legend = screen.getByText("Radio test 3");
        expect(legend).toHaveClass("Mui-required");
    });

    it("selects radio choice 5", async () => {
        render(<RadioBlock id="radio4" />, {
            blocks: blocks,
        });

        //get the span that wraps the input btn
        const radioOption4 = screen.getByRole("radio", {
            name: "Radio choice 4",
        });
        const wrapper4 = radioOption4.closest("span");

        const radioOption5 = screen.getByRole("radio", {
            name: "Radio choice 5",
        });
        const wrapper5 = radioOption5.closest("span");

        expect(wrapper4).not.toHaveClass("Mui-checked");
        expect(wrapper5).toHaveClass("Mui-checked");
    });
});
