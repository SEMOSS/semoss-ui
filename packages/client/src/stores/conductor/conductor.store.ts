import { makeAutoObservable } from 'mobx';
import { SubtaskState, SubtaskStoreInterface } from './subtask.store';
import { LLMInstructOutputStep } from '@/components/new-conductor/conductor.types';
import { v4 as uuidv4 } from 'uuid';
export interface ConductorStoreInterface {
    /**
     * TODO: ADD PROPERTIES TIED TO CONDUCTOR STORE
     * 11/5/24
     */
    /**
     * Task the user is trying to accomplish
     * Ultimately, its just a prompt we pass to LLM
     */
    task: null | string;

    /**
     * Insight tied to the conductor
     */
    insightId: string;

    /**
     * List of subtasks used to answer initial prompt
     */
    subtasks: SubtaskState[];

    /**
     * Are all subtasks executed, and completed
     */
    completedSubtasks: boolean;

    /**
     * Output from the initial prompt
     */
    taskOutput: string;
}

interface ConductorStoreConfig {
    /**
     * TODO: ADD PROPERTIES TIED TO CONDUCTOR STORE
     * 11/5/24
     */
    /**
     * Insight tied to the conductor
     */
    insightId: string;
    /**
     * List of subtasks used to answer initial prompt
     */
    subtasks: SubtaskState[];
}

/**
 * Internal state management of the inputs of steps for conductor
 */
export class ConductorStore {
    private _store: ConductorStoreInterface = {
        /**
         * 11/5/24
         */
        task: null,
        insightId: '',
        subtasks: [],
        completedSubtasks: false,
        taskOutput: '',
    };

    constructor(config: ConductorStoreConfig) {
        /**
         * TODO:
         */

        this._store.insightId = config.insightId;
        this._store.subtasks = [];

        makeAutoObservable(this); // make it observable
    }

    /**
     * NEW
     * TODO: FIX STORE
     */

    /**
     * Gets task that is determined by user
     */
    get task() {
        return this._store.task;
    }

    /**
     * Gets unique insight id tied to conductor
     */
    get insightId() {
        return this._store.insightId;
    }

    /**
     * Gets list of subtasks
     */
    get subtasks() {
        return this._store.subtasks;
    }

    /**
     * Are all subtasks complete
     */
    get completedSubtasks() {
        return this._store.completedSubtasks;
    }

    /**
     * Gets the output of the subtasks asked against the initial prompt
     */
    get taskOutput() {
        return this._store.taskOutput;
    }

    /**
     * ------------------------------------------
     * ACTIONS
     * ------------------------------------------
     */

    /**
     * Sets the task in store
     * @param t
     * @returns the task that user set
     */
    setTask(t: string): string {
        this._store.task = t;

        return this._store.task;
    }
    /**
     * Get a specific queries's state
     * @param id - id of the queries to get
     * @returns the specific block information
     */
    getSubtask(id: string): SubtaskState | null {
        const subtask = this._store.subtasks.find((sT) => {
            if (sT.id === id) {
                return sT;
            }
        });

        if (subtask) {
            return subtask;
        }

        return null;
    }

    /**
     * Set subtasks based on LLMInstruct reactor
     * @param subtasks
     */
    setSubtasks = (subtasks: LLMInstructOutputStep[]) => {
        // Initialize a list for subtasks
        const stagedList = [];

        subtasks.forEach((sT) => {
            const subtask = new SubtaskState({
                id: uuidv4(),
                description: sT.step,
                apps: sT.project_ids,
                // Reference to the conductor store to inform completion of subtasks
                conductor: this,
            });

            stagedList.push(subtask);
        });

        this._store.subtasks = stagedList as SubtaskState[];
    };

    /**
     * Goes through all subtasks to check if they have been executed
     */
    updateCompletedSubtask = () => {
        let isComplete = true;
        this._store.subtasks.forEach((sT) => {
            if (!sT.isExecuted) {
                isComplete = false;
            }
        });

        this._store.completedSubtasks = isComplete;
    };

    /**
     * The answer to the task, compromised by completed subtasks
     * @param output
     */
    setTaskOutput = (output) => {
        debugger;
        this._store.taskOutput = output;
    };
}
