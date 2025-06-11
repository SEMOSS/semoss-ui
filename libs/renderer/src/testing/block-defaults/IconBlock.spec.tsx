import { render } from "../utils";
import { expect, test } from "vitest";
import { fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { IconBlock } from "../../components/block-defaults/icon-block";

const blocks = {
    icon: {
        data: {
            style: {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "200px",
                color: "black",
            },
            icon: "Icon",
            src: "",
            title: "",
            show: "true",
        },
        listeners: {},
        slots: {},
        id: "icon",
        widget: "icon",
    },
};

describe("icon block", () => {
    it("renders correctly", async () => {
        const { container } = render(<IconBlock id="icon" />, {
            blocks: blocks,
        });

        const icon = container.querySelector("[data-block='icon']");
        expect(icon).toBeInTheDocument();

        screen.debug();
    });

    it("shows default icon", async () => {
        const { container } = render(<IconBlock id="icon" />, {
            blocks: blocks,
        });

        const icon = container.querySelector("[data-block='icon']");
        const iconType = icon.querySelector("[data-testid='InsertEmoticonOutlinedIcon']");

        expect(iconType).toBeInTheDocument();
    });
});
