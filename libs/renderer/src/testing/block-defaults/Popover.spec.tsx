import { render, screen } from "../utils";
import { expect } from "vitest";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ContainerBlock } from "../../components/block-defaults/container-block/ContainerBlock";
import { PopoverBlock } from "../../components/block-defaults/popover-block/PopoverBlock";

const blocks = {
    "hello-text": {
        id: "hello-text",
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
                children: ["popover"],
                name: "children",
            },
        },
        listeners: {
            onChange: [],
        },
    },
    popover: {
        data: {
            style: {},
            open: false,
            // makes popover visible for editing
            designMode: true,
            openTrigger: "click",
            contentBgColor: "",
            targetId: null,
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
            onChange: [],
        },
    },
    styledPopover: {
        data: {
            style: {
                height: "100px",
                width: "200px",
            },
            open: false,
            designMode: true,
            openTrigger: "click",
            contentBgColor: "",
            targetId: "container",
        },
        id: "styledPopover",
        widget: "popover",
        slots: {
            content: {
                name: "content",
                children: ["hello-text"],
            },
        },
        listeners: {
            onChange: [],
        },
    },
    notVisiblePopover: {
        data: {
            style: {},
            open: false,
            designMode: false,
            openTrigger: "click",
            contentBgColor: "",
            targetId: "container",
        },
        id: "notVisiblePopover",
        widget: "popover",
        slots: {
            content: {
                name: "content",
                children: [],
            },
        },
        listeners: {
            onChange: [],
        },
    },
};

describe("Popover Block", () => {
    beforeAll(() => {
        const { container } = render(<ContainerBlock id="target-container" />, {
            blocks: {
                "target-container": {
                    ...blocks["target-container"],
                },
            },
        });
    });

    it("renders correctly", async () => {
        const { container } = render(<PopoverBlock id="popover" />, {
            blocks: {
                popover: {
                    ...blocks["popover"],
                    parent: {
                        id: "target-container",
                        slot: "children",
                    },
                },
            },
        });

        const target = container.querySelector("[data-block=target-container");

        console.log(target);

        fireEvent.click(target);

        screen.debug();

        const element = container.querySelector("[data-block='popover']");

        console.log(container.innerHTML);

        expect(element).toBeInTheDocument();
        expect(screen.getByText("Add Content")).toBeInTheDocument();
    });

    // it("renders popover with correct dimension, color, and content", async () => {
    //     const { container } = render(<PopoverBlock id="styledPopover" />, {
    //         blocks: blocks,
    //     });

    //     // add color
    //     const element = container.querySelector("popover");
    //     expect(element).toBeInTheDocument();
    //     expect(element).toHaveStyle({ width: "200px", height: "100px" });
    //     expect(screen.getByText("Hello world")).toBeInTheDocument();
    // });

    // it("does not render in ui when designermode = false", async () => {
    //     const { container } = render(<PopoverBlock id="notVisiblePopover" />, {
    //         blocks: blocks,
    //     });

    //     const element = container.querySelector("popover");
    //     expect(element).not.toBeVisible();
    // });

    // it("renders on onClick", async () => {
    //     const { container } = render(<PopoverBlock id="popover" />, {
    //         blocks: blocks,
    //     });

    //     const element = container.querySelector("popover");
    //     const target = container.querySelector("parent-container");

    //     expect(element).not.toBeVisible();

    //     fireEvent.click(target);

    //     expect(element).toBeVisible();
    // });
});
