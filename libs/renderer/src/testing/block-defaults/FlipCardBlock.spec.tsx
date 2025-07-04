import { expect, test } from "vitest";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "../utils/index";
import { FlipCardBlock } from "../../components/block-defaults/flip-card-block/FlipCardBlock";
import { ListenerActions } from "@/store";


const blocks = {
    "front-text": {
        id: "front-text",
        widget: "text",
        parent: {
            id: "flip-card",
            slot: "children",
        },
        data: {
            style: {
                padding: "4px",
                whiteSpace: "pre-line",
                textOverflow: "ellipsis",
            },
            text: "Hello world",
            variant: "p",
        },
        listeners: {},
        slots: {},
    },
    "back-text": {
        id: "back-text",
        widget: "text",
        parent: {
            id: "flip-card",
            slot: "children",
        },
        data: {
            style: {
                padding: "4px",
                whiteSpace: "pre-line",
                textOverflow: "ellipsis",
            },
            text: "Backside",
            variant: "p",
        },
        listeners: {},
        slots: {},
    },
    "flip-card": {
        id: "flip-card",
        widget: "flip-card",
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
            },
            frontBgColor: "#ffffff",
            backBgColor: "#ffffff",
            isFlipped: false,
            show: "true",
        },
        listeners: {
            preProcess: {
                type: "async" as "async",
                order: [] as ListenerActions[],
            },
        },
        slots: {
            front: {
                name: "front",
                children: [
                    "front-text"
                ]
            },
            back: {
                name: "back",
                children: [
                    "back-text"
                ]
            }
        },
    },
};


describe("Flip Card Block", () => {
    test("renders correctly with mocked provider", async () => {
        const { container } = render(<FlipCardBlock id="flip-card" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='flip-card']");
        expect(element).toBeInTheDocument();
        screen.debug();
    });

    test("renders with correct styling", async () => {
        const { container } = render(<FlipCardBlock id="flip-card" />, {
            blocks: blocks,
        });

    });

     test("flip with correct text on both sides", async () => {
        const { container } = render(<FlipCardBlock id="flip-card" />, {
            blocks: blocks,
        });


    });
});