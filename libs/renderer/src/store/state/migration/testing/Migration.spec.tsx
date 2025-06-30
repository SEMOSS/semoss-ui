import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, mockDeep } from "vitest-mock-extended";
import {
    Migration,
    MigrationState,
    STATE_VERSION,
} from "@/store/state/migration";

import { Alpha08BlockData } from "./Alpha08DBloxkata";
import { Alpha04BlockData } from "./Alpha04BlockData";
import { Alpha04BlockData2 } from "./Alpha04BlockData2";

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
    });
}
