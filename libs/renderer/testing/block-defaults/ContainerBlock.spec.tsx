import { render, screen } from "../utils";
import { ContainerBlock } from "@/components/block-defaults/container-block/ContainerBlock";

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
            icon: "Icon",
            src: "",
            title: "",
            show: "true",
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

const nestedContainerBlock = {
    "child-container": {
        parent: {
            id: "parent-container",
            slot: "children",
        },
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
        },
        id: "child-container",
        widget: "container",
        slots: {
            children: {
                children: [],
                name: "children",
            },
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
    "parent-container": {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
        },
        id: "parent-container",
        widget: "container",
        slots: {
            children: {
                children: ["child-container"],
                name: "children",
            },
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

describe("Container Block", () => {
    it("Should render the Container Block", async () => {
        const { container } = render(
            // passing the data-testid property does not work; use the querySelector instead since data-block is a custom attribute
            <ContainerBlock data-testid="containerID" id="test-container" />,
            {
                blocks: blocks,
            },
        );
        const exist = container.querySelector("[data-block='test-container']");
        expect(exist).toBeInTheDocument();
    });

    it("Should render the Container's default Slot text", async () => {
        render(<ContainerBlock id="test-container" />, {
            blocks: blocks,
        });
        expect(screen.getByText("Add Content")).toBeInTheDocument();
    });

    it("Should render a Container Block inside a Container Block", async () => {
        const { container } = render(<ContainerBlock id="parent-container" />, {
            blocks: nestedContainerBlock,
        });

        expect(
            container.querySelector("[data-block='child-container']"),
        ).toBeInTheDocument();
    });

    it("Should render a P tag inside the Container Block", async () => {
        const { container } = render(
            // passing the data-testid property does not work; use the querySelector instead since data-block is a custom attribute
            <ContainerBlock data-testid="containerID" id="test-container" />,
            {
                blocks: {
                    "test-container": {
                        ...blocks["test-container"],
                        slots: {
                            children: {
                                children: ["p-tag"],
                                name: "children",
                            },
                        },
                    },
                    "p-tag": {
                        id: "p-tag",
                        widget: "text",
                        parent: {
                            id: "test-container",
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
                },
            },
        );
        expect(
            container.querySelector("[data-block='p-tag']"),
        ).toBeInTheDocument();
    });

    it("Should render a P tag with hello world as its content", async () => {
        render(<ContainerBlock id="test-container" />, {
            blocks: {
                "test-container": {
                    ...blocks["test-container"],
                    slots: {
                        children: {
                            children: ["p-tag"],
                            name: "children",
                        },
                    },
                },
                "p-tag": {
                    id: "p-tag",
                    widget: "text",
                    parent: {
                        id: "test-container",
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
            },
        });
        expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
});
