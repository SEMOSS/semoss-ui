import { expect } from "vitest";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { render, screen } from "../utils";
import { ContainerBlock } from "../../components/block-defaults/container-block/ContainerBlock";
import { PopoverBlock } from "../../components/block-defaults/popover-block/PopoverBlock";

const blocks = {
    helloText: {
        id: "helloText",
        widget: "text",
        parent: {
            id: "popover",
            slot: "content",
        },
        data: {
            style: {
                padding: "4px",
                whiteSpace: "pre-line",
                textOverflow: "ellipsis",
            },
            text: "Hello world",
            variant: "h1",
        },
        listeners: {},
        slots: {},
    },
    "target-container": {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
        },
        id: "target-container",
        widget: "container",
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
    popover: {
        parent: {
            id: "target-container",
            slot: "children",
        },
        data: {
            style: {},
            open: false,
            designMode: true,
            openTrigger: "click",
            contentBgColor: "",
            targetId: "target-container",
        },
        id: "popover",
        widget: "popover",
        slots: {
            content: {
                name: "content",
                children: [],
            },
        },
        listeners: {
            // onChange: [],
            onOpen: [],
        },
    },
    styledPopover: {
        parent: {
            id: "target-container",
            slot: "children",
        },
        data: {
            style: {
                height: "100px",
                width: "200px",
                backgroundColor: "#6c4747",
                border: "1px solid #000000",
            },
            open: false,
            designMode: true,
            openTrigger: "click",
            contentBgColor: "",
            targetId: "target-container",
        },
        id: "styledPopover",
        widget: "popover",
        slots: {
            content: {
                name: "content",
                children: ["helloText"],
            },
        },
        listeners: {
            //     onChange: []
            onOpen: [],
        },
    },
};

describe("Popover Block", () => {
    let target;
    beforeEach(() => {
        const { container } = render(<ContainerBlock id="target-container" />, {
            blocks: {
                "target-container": {
                    data: {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            padding: "4px",
                            gap: "8px",
                            flexWrap: "wrap",
                        },
                    },
                    id: "target-container",
                    widget: "container",
                    slots: {
                        children: {
                            children: ["popover", "styledPopover"],
                            name: "children",
                        },
                    },
                    listeners: {
                        onChange: [],
                    },
                },
            },
        });

        //parent container
        target = container.querySelector("[data-block='target-container']");
    });

    it("renders correctly", async () => {
        const { container } = render(<PopoverBlock id="popover" />, {
            blocks: {
                popover: {
                    ...blocks["popover"],
                },
            },
        });

        // click to trigger popover
        fireEvent.click(target);

        const element = container.querySelector("[data-block='popover']");

        expect(element).toBeInTheDocument();
        expect(screen.getByText("Add Content")).toBeInTheDocument();
    });

    // hello

    it("renders popover with correct styles and content", async () => {
        const { container } = render(<PopoverBlock id="styledPopover" />, {
            blocks: {
                styledPopover: {
                    ...blocks["styledPopover"],
                },
                helloText: {
                    ...blocks["helloText"],
                },
            },
        });

        fireEvent.click(target);

        const element = container.querySelector("[data-block='styledPopover']");

        expect(element).toHaveStyle({ width: "200px", height: "100px" });

        expect(element).toHaveStyle("backgroundColor: rgb(108, 71, 71)");
        expect(element).toHaveStyle("border: 1px solid #000000");

        expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
});
