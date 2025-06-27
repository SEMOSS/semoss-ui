import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, mockDeep } from "vitest-mock-extended";
import {
    Migration,
    MigrationState,
    STATE_VERSION,
} from "@/store/state/migration";

import { Alpha08BlockData } from "./Alpha08DBloxkata";
import { Alpha04BlockData } from "./Alpha04BlockData";

describe("Migration Manager starting from Alpha 04", () => {
    // let migrationManager: MigrationManager;
    let currentState: MigrationState = Alpha08BlockData;
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
                STATE_VERSION: "1.0.0-alpha.9", // default mock value
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
                STATE_VERSION: "1.0.0-alpha.10", // default mock value
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
