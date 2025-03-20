import { ContainerBlock } from "@/components/block-defaults/container-block/ContainerBlock";
import { config } from "@/components/block-defaults/container-block/config";
import { render, screen } from "../utils";
import { useBlock } from "@/hooks";

const blocks = {
    "test-container": {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
        },
        id: "test-container",
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
};

describe("container block", () => {
    test("Show container", async () => {
        const { container } = render(
            // passing the data-testid property does not work; use the querySelector instead since data-block is a custom attribute
            <ContainerBlock data-testid="containerID" id="test-container" />,
            {
                blocks: blocks,
            },
        );
        console.log({ container });

        const exist = container.querySelector("[data-block='test-container']");
        expect(exist).toBeInTheDocument();
    });
});
