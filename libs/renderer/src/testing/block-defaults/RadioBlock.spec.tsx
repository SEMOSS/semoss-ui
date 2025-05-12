import { fireEvent, render, screen } from "../utils";
import { expect } from "vitest";
import "@testing-library/jest-dom";

import { RadioBlock } from "@/components/block-defaults/radio-block/RadioBlock";

const blocks = {
    radio: {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
            label: "Radio test",
            options: [{ label: "Radio choice 1", value: "radioChoice1" }],
        },
        id: "radio",
        widget: "radio",
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
    // radio2: {
    //     data: {
    //         style: {
    //             display: "flex",
    //             flexDirection: "column",
    //             padding: "4px",
    //             gap: "8px",
    //             flexWrap: "wrap",
    //         },
    //         label: "Radio 2 test",
    //         disabled: true,
    //         options: [{ label: "Radio choice 2", value: "radioChoice2" }],
    //     },
    //     id: "radio",
    //     widget: "radio",
    //     slots: {
    //         children: {
    //             children: [],
    //             name: "",
    //         },
    //     },
    //     listeners: {
    //         onChange: [],
    //     },
    // },
    // radio3: {
    //     data: {
    //         style: {
    //             display: "flex",
    //             flexDirection: "column",
    //             padding: "4px",
    //             gap: "8px",
    //             flexWrap: "wrap",
    //         },
    //         label: "Radio 3 test",
    //         required: true,
    //         options: [
    //             { label: "Radio choice 3", value: "radioChoice3" },
    //             { label: "Radio choice 4", value: "radioChoice4" },
    //         ],
    //     },
    //     id: "radio",
    //     widget: "radio",
    //     slots: {
    //         children: {
    //             children: [],
    //             name: "",
    //         },
    //     },
    //     listeners: {
    //         onChange: [],
    //     },
    // },
};

describe("radio block", () => {
    it("renders correctly", async () => {
        const { container } = render(<RadioBlock id="radio" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='radio']");

        expect(element).toBeInTheDocument();
        expect(screen.getByText("Radio test")).toBeInTheDocument();
        expect(screen.getByText("Radio choice 1")).toBeInTheDocument();
    });

    // it("renders disabled correctly", async () => {
    //     const { container } = render(<RadioBlock id="radio2" />, {
    //         blocks: blocks,
    //     });

    //     const element = container.querySelector("[data-block='radio2']");
    //     const disabledElement = container.querySelector(".Mui-disabled");
    //     expect(element).toBeInTheDocument();
    //     expect(screen.getByText("Radio 2 test")).toBeInTheDocument();
    //     expect(screen.getByText("Radio choice 2")).toBeInTheDocument();
    //     expect(disabledElement).toBeInTheDocument();
    // });

    // it("renders required correctly", async () => {
    //     const { container } = render(<RadioBlock id="radio3" />, {
    //         blocks: blocks,
    //     });

    //     const element = container.querySelector("[data-block='radio3']");
    //     const requiredElement = container.querySelector(
    //         ".MuiFormLabel-asterisk",
    //     );
    //     expect(element).toBeInTheDocument();
    //     expect(screen.getByText("Radio 3 test")).toBeInTheDocument();
    //     expect(screen.getByText("Radio choice 3")).toBeInTheDocument();
    //     expect(screen.getByText("Radio choice 4")).toBeInTheDocument();
    //     expect(requiredElement).toBeInTheDocument();
    // });

    // it("selects radio choice 3", async () => {
    //     const { container } = render(<RadioBlock id="radio3" />, {
    //         blocks: blocks,
    //     });

    //     const element = container.querySelector("[data-block='radio3']");
    //     const requiredElement = container.querySelector(
    //         ".MuiFormLabel-asterisk",
    //     );
    //     fireEvent.click(screen.getByText("Radio choice 4"));
    //     const clickedElement = container.querySelector(
    //         "span.Mui-checked [value='radioChoice4']",
    //     );
    //     expect(element).toBeInTheDocument();
    //     expect(screen.getByText("Radio 3 test")).toBeInTheDocument();
    //     expect(clickedElement).not.toBeNull();
    //     expect(requiredElement).toBeInTheDocument();
    // });
});
