import React from "react";
import {
    EngineFile,
    EngineData,
    EngineDependenciesResponse,
    EngineInfo,
    EngineDependenciesState,
} from "../types/types";
 
/**
 * Extracts successful engine IDs from engine dependencies response
 * @param engineDependencies - The response object containing engine dependencies
 * @returns Array of successful engine IDs
 */
export const getSuccessfulEngineIds = (engineDependencies: EngineDependenciesResponse): string[] => {
    return engineDependencies?.success
        ? Object.keys(engineDependencies.success)
        : [];
};
 
/**
 * Extracts failed engine IDs from engine dependencies response
 * @param engineDependencies - The response object containing engine dependencies
 * @returns Array of failed engine IDs
 */
export const getFailedEngineIds = (engineDependencies: EngineDependenciesResponse): string[] => {
    return engineDependencies?.failed
        ? Object.keys(engineDependencies.failed)
        : [];
};
 
/**
 * Processes engine data and creates detailed engine information
 * @param engineDependencies - The response object containing engine dependencies
 * @returns Record mapping engine IDs to their detailed information
 */
export const processEngineDetails = (
    engineDependencies: EngineDependenciesResponse,
): Record<string, EngineInfo> => {
    const engineDetails: Record<string, EngineInfo> = {};
 
    // Process successful engines
    if (engineDependencies?.success) {
        Object.entries(engineDependencies.success).forEach(([id, obj]) => {
            engineDetails[id] = {
                name: obj.engineName || "",
                files: obj.files?.map((f: EngineFile) => f.filename) || [],
                instances:
                    obj.files?.map((f: EngineFile) => f.instances) || [],
            };
        });
    }
 
    // Process failed engines
    if (engineDependencies?.failed) {
        Object.entries(engineDependencies.failed).forEach(([id, obj]) => {
            engineDetails[id] = {
                name: obj.engineName || "",
                files: obj.files?.map((f: EngineFile) => f.filename) || [],
                instances:
                    obj.files?.map((f: EngineFile) => f.instances) || [],
            };
        });
    }
 
    return engineDetails;
};
 
/**
 * Processes engine dependencies response and returns structured data
 * This consolidates the extraction of successful IDs, failed IDs, and engine details
 * @param engineDependencies - The response object containing engine dependencies
 * @returns Complete engine dependencies state object
 */
export const processEngineDependencies = (
    engineDependencies: EngineDependenciesResponse,
): EngineDependenciesState => {
    return {
        successfulEngineIds: getSuccessfulEngineIds(engineDependencies),
        failedEngineIds: getFailedEngineIds(engineDependencies),
        engineDetails: processEngineDetails(engineDependencies),
    };
};
 
/**
 * Hook for managing engine dependencies state with consolidated updates
 * @returns State and setter for engine dependencies
 */
export const useEngineDependenciesState = () => {
    const [engineDependenciesState, setEngineDependenciesState] =
        React.useState<EngineDependenciesState>({
            successfulEngineIds: [],
            failedEngineIds: [],
            engineDetails: {},
        });
 
   
    const updateEngineDependencies = (engineDependencies: EngineDependenciesResponse) => {
        setEngineDependenciesState(
            processEngineDependencies(engineDependencies),
        );
    };
 
    /**
     * Reset all engine dependencies to initial state
     */
    const resetEngineDependencies = () => {
        setEngineDependenciesState({
            successfulEngineIds: [],
            failedEngineIds: [],
            engineDetails: {},
        });
    };
 
    return {
        engineDependenciesState,
        setEngineDependenciesState,
        updateEngineDependencies,
        resetEngineDependencies,
    };
};