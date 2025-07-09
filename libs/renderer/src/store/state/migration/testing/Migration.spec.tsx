import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, mockDeep } from "vitest-mock-extended";
import {
    Migration,
    MigrationState,
    STATE_VERSION,
} from "@/store/state/migration";

import { Alpha08BlockData } from "./Alpha08BlockData";
import { Alpha04BlockData } from "./Alpha04BlockData";
import { Alpha04BlockData2 } from "./Alpha04BlockData2";
import { Alpha09BlockData } from "./Alpha09BlockData";

const testsData = [
    {
        name: "1.0.0-alpha.4",
        data: Alpha04BlockData,
    },
    {
        name: "1.0.0-alpha.4(v2)",
        data: Alpha04BlockData2,
    },
    { name: "1.0.0-alpha.8", data: Alpha08BlockData },
    { name: "1.0.0-alpha.9", data: Alpha09BlockData },
];

for (const testData of testsData) {
    describe("Migration Manager starting from " + testData.name, () => {
        // let migrationManager: MigrationManager;
        let currentState: MigrationState = testData.data;
        // let currentState: MigrationState = migrationDemoData;

        beforeEach(() => {
            // vi.doMock("@/store/state/migration/StateVersion", () => {
            //     return {
            //         STATE_VERSION: "1.0.0-alpha.9",
            //     };
            // });
            // migrationManager = new MigrationManager();
            // currentState = migrationDemoData;
            // vi.resetAllMocks();
        });
        afterEach(() => {
            vi.resetModules();
        });

        it("should migrate from 1.0.0-alpha.4 to 1.0.0-alpha.5", async ({
            skip,
        }) => {
            // skip test if the starting currentState version does not match the test version condition
            if (currentState.version !== "1.0.0-alpha.4") {
                skip();
            }
            // const version = "1.0.0-alpha.9";
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.5", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );

            const migrationManager = new MigrationManager();

            // expect initial version before migration
            expect(currentState.version).toBe("1.0.0-alpha.4");

            currentState = await migrationManager.run(currentState);

            for (const keyValue of Object.entries(currentState.blocks)) {
                const widgets = [
                    "accordion",
                    "container",
                    "flip-card",
                    "popover",
                    "modal",
                    "sidebar",
                    "iteration",
                    "link",
                    "logs",
                    "markdown",
                    "text",
                    "audio-input",
                    "audio-player",
                    "button",
                    "checkbox",
                    "input",
                    "radio",
                    "select",
                    "slider",
                    "switch",
                    "timepicker",
                    "toggle-button",
                    "upload",
                    "chip",
                    "divider",
                    "iframe",
                    "image",
                    "pdfViewer",
                    "progress",
                    "ratings",
                ];
                const block = keyValue[1];
                // console.log({ block: block.widget });

                if (widgets.includes(block.widget)) {
                    // console.log({ block });
                    switch (block.widget) {
                        case "popover": {
                            expect(block.listeners.onOpen.length).toBe(0);
                            expect(block.listeners.onClose.length).toBe(0);
                            expect(block.listeners).not.toHaveProperty(
                                "onClick",
                            );
                        }
                        case "modal": {
                            expect(block.listeners.preProcess.length).toBe(0);
                            expect(block.listeners.onClose.length).toBe(0);
                            expect(block.listeners).not.toHaveProperty(
                                "onSubmit",
                            );
                            break;
                        }
                        case "sidebar": {
                            expect(block.listeners.preProcess.length).toBe(0);
                            expect(block.listeners.postProcess.length).toBe(0);
                            break;
                        }
                        case "audio-input": {
                            expect(block.listeners.preProcess.length).toBe(0);
                            expect(block.listeners.onComplete.length).toBe(0);
                            break;
                        }
                        case "switch":
                        case "toggle-button": {
                            // console.log({ block: block.widget });
                            expect(block.listeners.preProcess.length).toBe(0);
                            expect(block.listeners.onChange.length).toBe(0);
                            break;
                        }
                        default: {
                            expect(block.listeners.preProcess.length).toBe(0);
                        }
                    }
                }
            }
            // console.log({currentState: Object.entries(currentState.blocks)})
            expect(currentState.version).toBe("1.0.0-alpha.5");
        });
        it("should migrate from 1.0.0-alpha.5 to 1.0.0-alpha.6", async ({
            skip,
        }) => {
            // skip test if the starting currentState version does not match the test version condition
            if (currentState.version !== "1.0.0-alpha.5") {
                skip();
            }

            // const version = "1.0.0-alpha.9";
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.6", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );

            const migrationManager = new MigrationManager();

            // expect initial version before migration
            expect(currentState.version).toBe("1.0.0-alpha.5");

            currentState = await migrationManager.run(currentState);

            for (const block of Object.values(currentState.blocks)) {
                for (const listener of Object.keys(block.listeners)) {
                    // console.log({
                    //     widget: currentState.blocks[block.id].widget,
                    //     type: currentState.blocks[block.id].listeners[listener]
                    //         .type,
                    //     order: currentState.blocks[block.id].listeners[listener]
                    //         .order,
                    // });
                    const type =
                        currentState.blocks[block.id].listeners[listener].type;
                    // const order =
                    //     currentState.blocks[block.id].listeners[listener].order;
                    expect(type).toBe("sync");
                }
            }

            expect(currentState.version).toBe("1.0.0-alpha.6");
        });
        it("should migrate from 1.0.0-alpha.6 to 1.0.0-alpha.7", async ({
            skip,
        }) => {
            // skip test if the starting currentState version does not match the test version condition
            if (currentState.version !== "1.0.0-alpha.6") {
                skip();
            }
            // const version = "1.0.0-alpha.9";
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.7", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );

            const migrationManager = new MigrationManager();

            // expect initial version before migration
            expect(currentState.version).toBe("1.0.0-alpha.6");

            currentState = await migrationManager.run(currentState);

            for (const blocks of Object.entries(currentState.blocks)) {
                const block = blocks[1];

                if (block.widget === "e-chart") {
                    const preProcessListener = block.listeners.preProcess;
                    expect(preProcessListener).toMatchObject({
                        type: "sync",
                        order: [],
                    });
                }
            }

            expect(currentState.version).toBe("1.0.0-alpha.7");
        });
        it("should migrate from 1.0.0-alpha.7 to 1.0.0-alpha.8", async ({
            skip,
        }) => {
            // skip test if the starting currentState version does not match the test version condition
            if (currentState.version !== "1.0.0-alpha.7") {
                skip();
            }
            // const version = "1.0.0-alpha.9";
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.8", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );

            const migrationManager = new MigrationManager();

            // expect initial version before migration
            expect(currentState.version).toBe("1.0.0-alpha.7");

            currentState = await migrationManager.run(currentState);

            for (const keyValue of Object.entries(currentState.blocks)) {
                const block = keyValue[1];
                if (block.widget === "upload") {
                    expect(block.listeners).not.toHaveProperty("onClick");
                    expect(block.listeners).toHaveProperty("onChange");
                }
            }

            expect(currentState.version).toBe("1.0.0-alpha.8");
        });

        it("should migrate from 1.0.0-alpha.8 to 1.0.0-alpha.9", async ({
            skip,
        }) => {
            // skip test if the starting currentState version does not match the test version condition
            if (currentState.version !== "1.0.0-alpha.8") {
                skip();
            }
            // const version = "1.0.0-alpha.9";
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.9", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );

            const migrationManager = new MigrationManager();

            expect(currentState.version).toBe("1.0.0-alpha.8");

            currentState = await migrationManager.run(currentState);

            expect(currentState.version).toBe("1.0.0-alpha.9");
        });

        it("should migrate from 1.0.0-alpha.8 to 1.0.0-alpha.9 with custom test data", async ({
            skip,
        }) => {
            const initialState = {
                queries: {
                    q1: {
                        id: "q1",
                        cells: [
                            { id: "1", content: "Cell 1" },
                            { id: "2", content: "Cell 2" },
                        ],
                    },
                },
                variables: [
                    { to: "q1", cellId: "1", value: "Value 1" },
                    { to: "q1", cellId: "2", value: "Value 2" },
                ],
                version: "1.0.0-alpha.8",
            };

            const expectedState = {
                queries: {
                    q1: {
                        id: "q1",
                        cells: [
                            { id: "3", content: "Cell 1" },
                            { id: "4", content: "Cell 2" },
                        ],
                    },
                },
                variables: [
                    { to: "q1", cellId: "3", value: "Value 1" },
                    { to: "q1", cellId: "4", value: "Value 2" },
                ],
                version: "1.0.0-alpha.9",
            };
            // skip test if the starting currentState version does not match the test version condition
            if (initialState.version !== "1.0.0-alpha.8") {
                skip();
            }
            // const version = "1.0.0-alpha.9";
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.9", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );

            const migrationManager = new MigrationManager();

            expect(initialState.version).toBe("1.0.0-alpha.8");

            const newState = await migrationManager.run(initialState);

            expect(newState).toStrictEqual(expectedState);

            expect(newState.version).toBe("1.0.0-alpha.9");
        });

        it("should migrate from 1.0.0-alpha.9 to 1.0.0-alpha.10", async ({
            skip,
        }) => {
            // skip test if the starting currentState version does not match the test version condition
            if (currentState.version !== "1.0.0-alpha.9") {
                skip();
            }
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.10", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );
            const migrationManager = new MigrationManager();

            expect(currentState.version).toBe("1.0.0-alpha.9");

            currentState = await migrationManager.run(currentState);

            expect(currentState.version).toBe("1.0.0-alpha.10");
        });

        it("should migrate from 1.0.0-alpha.10 to 1.0.0-alpha.11", async ({
            skip,
        }) => {
            // skip test if the starting currentState version does not match the test version condition
            if (currentState.version !== "1.0.0-alpha.10") {
                skip();
            }
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.11", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );
            const migrationManager = new MigrationManager();

            expect(currentState.version).toBe("1.0.0-alpha.10");

            currentState = await migrationManager.run(currentState);

            expect(currentState.version).toBe("1.0.0-alpha.11");
        });

        it("should migrate from 1.0.0-alpha.10 to 1.0.0-alpha.11; aggregateFormatter1 (echart-bar-graph)", async ({
            skip,
        }) => {
            const initialState = {
                blocks: {
                    block1: {
                        widget: "e-chart",
                        data: {
                            variation: "echart-bar-graph",
                            columns: [
                                { selector: "field1" },
                                { selector: "field2" },
                            ],
                            aggregate: null,
                        },
                    },
                },
                version: "1.0.0-alpha.10",
            };

            // skip test if the starting currentState version does not match the test version condition
            if (initialState.version !== "1.0.0-alpha.10") {
                skip();
            }
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.11", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );
            const migrationManager = new MigrationManager();

            expect(initialState.version).toBe("1.0.0-alpha.10");

            const newState = await migrationManager.run(initialState);

            expect(newState.version).toBe("1.0.0-alpha.11");

            // console.log({ newState });

            expect(newState.blocks.block1.data.aggregate).toStrictEqual({
                0: { field1: "" },
                1: { field2: "Average" },
            });
        });

        it("should migrate from 1.0.0-alpha.10 to 1.0.0-alpha.11; aggregateFormatter1 (echart-gantt-chart)", async ({
            skip,
        }) => {
            const initialState = {
                blocks: {
                    block1: {
                        widget: "e-chart",
                        data: {
                            variation: "echart-gantt-chart",
                            option: {
                                customSettings: {
                                    columnDetails: {
                                        column1: {
                                            name: "Col1",
                                            selector: "COL1_SELECTOR",
                                        },
                                        column2: {
                                            name: "Col2",
                                            selector: "COL2_SELECTOR",
                                        },
                                    },
                                },
                            },
                            aggregate: null,
                        },
                    },
                },
                version: "1.0.0-alpha.10",
            };

            // skip test if the starting currentState version does not match the test version condition
            if (initialState.version !== "1.0.0-alpha.10") {
                skip();
            }
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.11", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );
            const migrationManager = new MigrationManager();

            expect(initialState.version).toBe("1.0.0-alpha.10");

            const newState = await migrationManager.run(initialState);

            expect(newState.version).toBe("1.0.0-alpha.11");

            // console.log({ newState });

            expect(newState.blocks.block1.data.aggregate).toEqual({
                0: { COL1_SELECTOR: "" },
                1: { COL2_SELECTOR: "Average" },
            });
        });

        it("should migrate from 1.0.0-alpha.10 to 1.0.0-alpha.11; aggregateFormatter2 (echart-pie-chart)", async ({
            skip,
        }) => {
            const initialState = {
                blocks: {
                    block1: {
                        widget: "e-chart",
                        data: {
                            variation: "echart-pie-chart",
                            option: {
                                _state: {
                                    fields: {
                                        Label: "F1",
                                        Value: "V1",
                                        // Label: ["F1", "F2"],
                                        // Value: ["V1", "V2"],
                                    },
                                },
                            },
                            aggregate: null,
                        },
                    },
                },
                version: "1.0.0-alpha.10",
            };

            // skip test if the starting currentState version does not match the test version condition
            if (initialState.version !== "1.0.0-alpha.10") {
                skip();
            }
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.11", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );
            const migrationManager = new MigrationManager();

            expect(initialState.version).toBe("1.0.0-alpha.10");

            const newState = await migrationManager.run(initialState);

            expect(newState.version).toBe("1.0.0-alpha.11");

            console.log({ aggregate: newState.blocks.block1.data.aggregate });

            expect(newState.blocks.block1.data.aggregate).toEqual({
                Label: {
                    F1: "",
                },
                Value: {
                    V1: "Average",
                },
            });
        });

        it("should migrate from 1.0.0-alpha.10 to 1.0.0-alpha.11; aggregateFormatter2 (echart-line-graph)", async ({
            skip,
        }) => {
            const initialState = {
                blocks: {
                    block1: {
                        widget: "e-chart",
                        data: {
                            variation: "echart-line-graph",
                            option: {
                                _state: {
                                    fields: {
                                        Label: ["F1", "F2"],
                                        Value: ["F1V1", "F2V2"],
                                    },
                                },
                            },
                            aggregate: null,
                        },
                    },
                },
                version: "1.0.0-alpha.10",
            };

            // skip test if the starting currentState version does not match the test version condition
            if (initialState.version !== "1.0.0-alpha.10") {
                skip();
            }
            vi.doMock("@/store/state/migration/StateVersion", () => {
                return {
                    STATE_VERSION: "1.0.0-alpha.11", // mock latest state version
                };
            });
            const { MigrationManager } = await import(
                "@/store/state/migration/MigrationManager"
            );
            const { STATE_VERSION } = await import(
                "@/store/state/migration/StateVersion"
            );
            const migrationManager = new MigrationManager();

            expect(initialState.version).toBe("1.0.0-alpha.10");

            const newState = await migrationManager.run(initialState);

            expect(newState.version).toBe("1.0.0-alpha.11");

            // console.log({ newState });

            expect(newState.blocks.block1.data.aggregate).toEqual({
                Label: {
                    F1: "",
                    F2: "",
                },
                Value: {
                    F1V1: "Average",
                    F2V2: "Average",
                },
            });
        });
    });
}
