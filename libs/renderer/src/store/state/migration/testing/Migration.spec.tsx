// import { render } from "@/testing/utils";
import { describe, it, expect, afterEach, vi } from "vitest";

// Mock state before migration
const initialState = {
    queries: {
        "test-query": {
            id: "test-query",
            cells: [
                { id: 1, widget: "code" },
                { id: 2, widget: "code" },
            ],
        },
    },
    variables: {
        // Existing variable
        "test-query--1": {
            type: "cell",
            to: "test-query",
            cellId: 1,
        },
    },
    version: "1.0.0-alpha.8",
};
const initialStateWithDuplicates = {
    queries: {
        "test-query": {
            id: "test-query",
            cells: [
                { id: 1, widget: "code" },
                { id: 2, widget: "code" },
            ],
        },
    },
    variables: {
        // Existing variable
        "test-query--1": {
            type: "cell",
            to: "test-query",
            cellId: 2,
        },
        "test-query-dup": {
            type: "cell",
            to: "test-query",
            cellId: 2,
        },
    },
    version: "1.0.0-alpha.8",
};

vi.mock("@/store/state/migration/MigrationManager", async () => {
    const originalModule = await vi.importActual<object>(
        "@/store/state/migration/MigrationManager",
    );

    return {
        ...originalModule,
        STATE_VERSION: "1.0.0-alpha.9",
    };
});
import { MigrationManager as MM } from "@/store/state/migration/MigrationManager";
import { migrationDemoData } from "./1_0_0_alpha_8_data";

describe("Migration tests from 1.0.0-alpha.8 to 1.0.0-alpha.9", () => {
    afterEach(() => vi.resetModules());

    it("should mock version", async () => {
        const migrationManager = new MM();
        const migrateState = await migrationManager.run(initialState);

        expect(migrateState.version).toBe("1.0.0-alpha.9");
    });
    // it("should convert all cells to variables", async () => {
    //     const migration = new MM();
    //     const newState = await migration.run(initialState);

    //     // Check that variables are added correctly
    //     expect(Object.keys(newState.variables)).toContain("test-query--2");
    //     expect(newState.variables["test-query--2"]).toEqual({
    //         type: "cell",
    //         to: "test-query",
    //         cellId: 2,
    //     });
    // });
    // it("should not duplicate existing variables", async () => {
    //     const migration = new MM();

    //     // Run migration
    //     const newState = await migration.run(initialState);

    //     // Check that existing variables are not duplicated
    //     expect(
    //         Object.keys(newState.variables).filter((v) => v === "test-query--1")
    //             .length,
    //     ).toBe(1);
    // });

    // it("should generate unique keys using randomSuffix", async () => {
    //     const randomMockSuffix = vi.spyOn(Math, "random").mockReturnValue(123);

    //     const migration = new MM();
    //     const newState = await migration.run(initialStateWithDuplicates);

    //     expect(newState);
    // });
});
