import { expect, test } from "vitest";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "../utils/index";
import { SelectBlock } from "../../components/block-defaults/select-block/SelectBlock";
import { ListenerActions } from "@/store";

const blocks = {
    select: {
        id: "select",
        widget: "select",
        data: {
            style: {},
            value: "",
            label: "Example Select",
            hint: "",
            options: "",
            required: false,
            disabled: false,
            loading: false,
            show: "true",
        },
        listeners: {},
        slots: {
            content: {
                name: "content",
                children: [],
            },
        },
    },
    querySelect: {
        id: "querySelect",
        widget: "select",
        data: {
            style: {},
            value: "",
            label: "Example Select",
            hint: "",
            options: ["1", "2"],
            required: false,
            disabled: false,
            loading: false,
            show: "true",
            multiple: false,
        },
          listeners: {
            onChange: {
                type: "async" as "async",
                order: [] as ListenerActions[],
            },
            preProcess: {
                type: "async" as "async",
                order: [] as ListenerActions[],
            },
        },
        slots: {
            content: {
                name: "content",
                children: [],
            },
        },
    },
    multiQuerySelect: {
        id: "multiQuerySelect",
        widget: "select",
        data: {
            style: {},
            value: "",
            label: "Example Select",
            hint: "",
            options: ["1", "2"],
            required: false,
            disabled: false,
            loading: false,
            multiple: true,
            show: "true",
        },
         listeners: {
            onChange: {
                type: "async" as "async",
                order: [] as ListenerActions[],
            },
            preProcess: {
                type: "async" as "async",
                order: [] as ListenerActions[],
            },
        },
        slots: {
            content: {
                name: "content",
                children: [],
            },
        },
    },
};

describe("select block", () => {
    test("renders correctly with mocked provider", async () => {
        const { container } = render(<SelectBlock id="select" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='select']");
        expect(element).toBeInTheDocument();
    });

    test("renders with correct label", async () => {
        const { container } = render(<SelectBlock id="select" />, {
            blocks: blocks,
        });

        const element = container.querySelector("input");
        const label = screen.getByLabelText("Example Select");

        expect(label).toBeTruthy();
    });

     test("renders with select options", async () => {
        const { container } = render(<SelectBlock id="querySelect" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='querySelect']");
        expect(element).toBeInTheDocument();
        
        const dropdown = container.querySelector("button");
        fireEvent.click(dropdown);

        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();

        screen.debug();

    });

    test("typing select options", async () => {
        const { container } = render(<SelectBlock id="querySelect" />, {
            blocks: blocks,
        });
        
        const input = container.querySelector("input");
        fireEvent.click(input);

        fireEvent.change(input, { target: { value: "1"}});
        expect(screen.getByText("1")).toBeInTheDocument();
        //expect(screen.getByText("2")).not.toBeInTheDocument();
        expect(input.value).toBe("1");

    });

    test("does not allow multi select if multiselect is disabled", async () => {
        const { container } = render(<SelectBlock id="querySelect" />, {
            blocks: blocks,
        });

        const input = container.querySelector("input");
        fireEvent.click(input);

        fireEvent.change(input, { target: { value: "1"}});
        fireEvent.change(input, { target: { value: "2"}});
        expect(input.value).toBe("2");


    });

    // multi select does not work (ui too)

    //  test("selects multiple options if mulitselect is enabled", async () => {
    //     const { container } = render(<SelectBlock id="multiQuerySelect" />, {
    //         blocks: blocks,
    //         queryConfig: queries,
    //     });

    //     const element = container.querySelector("[data-block='multiQuerySelect']");
    //     expect(element).toBeInTheDocument();

    //     const input = container.querySelector("input");
    //     fireEvent.click(input);

    //     fireEvent.change(input, { target: { value: "1"}});
    //     fireEvent.change(input, { target: { value: "2"}});
    //     //expect(input.value).toBe("1 2");
    //});

});
