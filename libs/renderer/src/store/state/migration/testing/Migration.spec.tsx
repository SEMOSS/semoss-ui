// // import { render } from "@/testing/utils";
// import { describe, it, expect, afterEach, vi } from "vitest";
// import { MigrationManager as MM } from "@/store/state/migration/MigrationManager";
// import { DeepMockProxy, mockDeep, mock } from "vitest-mock-extended";
// import { migrationDemoData } from "./1_0_0_alpha_8_data";
// // Mock state before migration
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
// const initialStateWithDuplicates = {
//     queries: {
//         "test-query": {
//             id: "test-query",
//             cells: [
//                 { id: 1, widget: "code" },
//                 { id: 2, widget: "code" },
//             ],
//         },
//     },
//     variables: {
//         // Existing variable
//         "test-query--1": {
//             type: "cell",
//             to: "test-query",
//             cellId: 2,
//         },
//         "test-query-dup": {
//             type: "cell",
//             to: "test-query",
//             cellId: 2,
//         },
//     },
//     version: "1.0.0-alpha.8",
// };

// // vi.mock("@/store/state/migration/MigrationManager", async () => {
// //     const originalModule = await vi.importActual<object>(
// //         "@/store/state/migration/MigrationManager",
// //     );

// //     return {
// //         ...originalModule,
// //         STATE_VERSION: "1.0.0-alpha.9",
// //     };
// // });

// vi.mock("@/store/state/migration/MigrationManager", async () => ({
//     MM: mockDeep<MM>(),
// }));

// describe("Migration tests from 1.0.0-alpha.8 to 1.0.0-alpha.9", () => {
//     // beforeEach(async () => {
//     //     const actualMM = await vi.importActual<
//     //         typeof import("@/store/state/migration/MigrationManager")
//     //     >("MM");

//     //     vi.mocked(MM).mockImplementation(() => actualMM);
//     // });

//     // afterEach(() => vi.resetModules());
//     it("should call deepProp", async () => {
//         const mock: DeepMockProxy<MM> = mockDeep<MM>();
//         mock.run.mockResolvedValue((data) => ({
//             ...data,
//             version: "1.0.0-alpha.9",
//         }));
//         const res = await mock.run(initialState);
//         console.log({res: res.version})
//         expect(res.version).toBe("1.0.0-alpha.9");
//         // expect(mock.run)
//         // expect(mock.deepProp())
//         // await mockReturnValue("1.0.0-alpha.9");
//         // expect(mock.deepProp(1)).toBe(3);
//     });

//     // it("should mock version", async () => {
//     //     const migrationManager = new MM();
//     //     const migrateState = await migrationManager.run(initialState);

//     //     expect(migrateState.version).toBe("1.0.0-alpha.9");
//     // });
//     // it("should convert all cells to variables", async () => {
//     //     const migration = new MM();
//     //     const newState = await migration.run(initialState);

//     //     // Check that variables are added correctly
//     //     expect(Object.keys(newState.variables)).toContain("test-query--2");
//     //     expect(newState.variables["test-query--2"]).toEqual({
//     //         type: "cell",
//     //         to: "test-query",
//     //         cellId: 2,
//     //     });
//     // });
//     // it("should not duplicate existing variables", async () => {
//     //     const migration = new MM();

//     //     // Run migration
//     //     const newState = await migration.run(initialState);

//     //     // Check that existing variables are not duplicated
//     //     expect(
//     //         Object.keys(newState.variables).filter((v) => v === "test-query--1")
//     //             .length,
//     //     ).toBe(1);
//     // });

//     // it("should generate unique keys using randomSuffix", async () => {
//     //     const randomMockSuffix = vi.spyOn(Math, "random").mockReturnValue(123);

//     //     const migration = new MM();
//     //     const newState = await migration.run(initialStateWithDuplicates);

//     //     expect(newState);
//     // });
// });
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, mockDeep } from "vitest-mock-extended";
import {
    Migration,
    MigrationState,
    STATE_VERSION,
} from "@/store/state/migration";
import { MigrationManager } from "@/store/state/migration/MigrationManager";
// import * as migrations from "@/store/state/migration/MigrationManager";

// vi.mock("@/store/state/migration/MigrationManager", async () => ({
//     MigrationManager: vi.fn().mockReturnValue(mockDeep<MigrationManager>()),
// }));

// vi.mock("@/store/state/migration/MigrationManager", async (actualImport) => {
//     return {
//         ...(await actualImport()),
//     };
// });

describe("Migration Manager", () => {
    it("should mock a class method", () => {
        const mm = mock<MigrationManager>();
        mm.run
            .calledWith(initialState)
            .mockReturnValue({ version: "1.0.0-alpha.9" });

        const result = mm.run(initialState);
        expect(result).toEqual({ version: "1.0.0-alpha.9" });
        expect(mm.run).toHaveBeenCalledWith(initialState);
    });
});

// describe("Migration Manager", () => {
//     it("should migrate state from alpha.8 to alpha.9", () => {
//         // const mm = new MigrationManager();

//         // mm.run(initialState);
//         const methodSpy = vi.mock(MigrationManager.prototype, "run");
//         expect(methodSpy).toHaveBeenCalledOnce();
//     });
// });

// Create a mock for the migration
// vi.mock("./migrate__1_0_0_alpha_8__to___1_0_0_alpha_9_", () => ({
//     versionFrom: "1.0.0-alpha.8",
//     versionTo: "1.0.0-alpha.9",
//     run: vi.fn(async (state) => {
//         // Simulate migration logic
//         return {
//             ...state,
//             version: "1.0.0-alpha.9",
//             // other state changes can be simulated here if needed
//         };
//     }),
// }));

// describe("MigrationManager", () => {
//     let migrationManager: MigrationManager;

//     beforeEach(() => {
//         // Mock STATE_VERSION globally
//         vi.doMock("./state/migration/MigrationManager", () => ({
//             STATE_VERSION: "1.0.0-alpha.9",
//             MigrationManager: MigrationManager,
//         }));

//         migrationManager = new MigrationManager();
//     });

//     it("should migrate state from alpha.8 to alpha.9", async () => {
//         // Initial state
//         const initialState = {
//             version: "1.0.0-alpha.8",
//             // other state properties here
//         };

//         const newState = await migrationManager.run(initialState);

//         expect(newState.version).toBe("1.0.0-alpha.9");
//         expect(
//             migrate__1_0_0_alpha_8_to_1_0_0_alpha_9.run,
//         ).toHaveBeenCalledWith(initialState);
//         // Add more assertions based on state changes
//     });
// });
