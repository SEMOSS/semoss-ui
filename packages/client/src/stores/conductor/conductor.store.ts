import { makeAutoObservable } from 'mobx';

export interface SubtaskInterface {
    // region
    // has the play button been pressed? --> outputVals = {...} || null
    // what are ids for the apps that have been suggested? --> appOptionIds = [ idString... ] || []
    // what app id has been selected? --> selectedAppId = string || null
    // what is the json for the selected app? --> not needed, fetch using selectedAppId
    // what are the appInput variables? --> inputVarsMap
    // populate appInputs as keys with appDetails reactor
    // all vals default to null indicating user has not yet mapped inputVar
    // user selects key from Object.keys(steps[i-1].outValsObj)
    // multiple inputs can have the same output
    // inputs must be mapped to outputs OR values must be input manually

    // each step will need an inputs form built from inputVarsMap
    // this is not a rendering of the app
    // if input is mapped output val can be filled as default
    // if input is not mapped a value must be input manually
    // this can be checked at runtime for runPlayButton reactor
    // values can be tracked in useForm rather than state?

    // input values do not need to be tracked in state?
    // could be tracked in manualInputsMap... = { inputVar: manualInputVal }
    // manualInputsMap... = { inputVar: manualInputVal, ... } || {}
    // can be empty, not all inputs need to have manual assignment
    // if user enters value in field manually enters key / val here
    // on runtime for runPlayButton reactor checks for manual input first
    // if manual input is present ignores mapped output
    // should flag input visually to indicate manual input value
    // should offer reset to mapped output
    // should flag if no output is mapped
    // should show mapped output as varname or value if prev step has run
    // what are the appOutput variables?
    // if the app has been run what are the app output values?

    // inputsMap = { appVarName: mappedVarName, ... } || { appVarName: null, ... }
    // outputVals = { outputVarName: outputVal } || null (idicates if app has run)
    // manualInputs = { inputVar: manualInputVal, ... } || {}
    // optionAppIds = [ idStrings... ] <-- only used once to fetch details
    // optionAppDetails = [{ id: string, appName: string, details: string, ... }, ...] <-- in same order as ids
    // selectedAppId = string for id || null

    // Possibly not needed?
    // outputVarsMap = { appVarName: [mappedVarNames...] } <-- creates second source of truth for var mapping in inputVarsMap
    // selectedApp = JSON for app / block structure || null <-- is this needed or just appId?

    // runPlayButton () => {
    // can only play if...
    // conductor.step[i].selectedAppId != null
    // conductor.step[i - 1].outputValsObj != null
    //
    // should be responsibility of NewConductorStep component maybe
    // runs playSubtask reactor with selected appId (name tbd)
    // reactor args from conductorSteps...
    // conductor.steps[i - 1].outputValsObj dict
    // the app id
    // reactor will return...
    // new OutputValsObj dict
    // update conductor.steps[i]...
    // update outputValues
    // }

    // inputsMap: Record<string, string>; // { appVarName: mappedVarName, ... } || { appVarName: null, ... }
    // optionAppIds: Array<string>; // [ idStrings... ] <-- only used once to fetch details
    // manualInputs: Record<string, string> // { inputVar: manualInputVal, ... } || {}
    // optionAppDetails: null | Array<Object[]>; // [{ id: string, appName: string, details: string, ... }, ...] <-- in same order as ids
    // selectedAppId: null | string; // string for id || null
    // outputVals: null | Record<string, any>; // { outputVarName: outputVal } || null (idicates if app has run)

    // endregion

    taskName: string;
    taskDescription: null | string;
    inputsMap: Record<string, string>;
    optionAppIds: Array<string>;
    manualInputs: Record<string, string>;
    optionAppDetails: null | Array<Object[]>;
    selectedAppId: null | string;
    isSetupComplete: boolean;
    isExpanded: boolean;
    outputVals: null | Record<string, any>;

    // nextSubtask: null | string;
    // prevSubtask: null | string;
}

export interface ConductorStoreInterface {
    inputPool: Record<string, unknown>;
    steps: unknown[];

    initPrompt: null | string;
    subTasks: Array<SubtaskInterface>;

    // track subtasks, which will have their own interface

    /**
     * Stores all of our inputs and outputs of apps as steps
     * TODO: We may want to just update this to be renamed to inputPool
     * */
    // inputOutputPool: Record<string, unknown>;

    /**
     * Looks at our input output pool and updates values as they get updated
     * TODO: Same as above ^
     *  */
    // updateInputOutputPool: (key: string, value: unknown) => void;
}

/**
 * Internal state management of the inputs of steps for conductor
 */
export class ConductorStore {
    private _store: ConductorStoreInterface = {
        inputPool: {},
        steps: [],

        initPrompt: '',
        subTasks: [],
    };

    constructor(config: ConductorStoreInterface) {
        this._store.inputPool = config.inputPool;
        this._store.steps = config.steps;

        this._store.initPrompt = '';
        this._store.subTasks = [];

        makeAutoObservable(this); // make it observable
    }

    /**
     * Old Getters
     */
    get inputPool() {
        return this._store.inputPool;
    }

    get steps() {
        return this._store.steps;
    }

    /**
     * New Getters
     */
    get initPrompt() {
        return this._store.initPrompt;
    }

    get subTasks() {
        return this._store.subTasks;
    }

    /**
     * Old Actions
     */
    setInputValue(key: string, value: unknown) {
        console.log(key, value);
        this._store.inputPool[key] = value;
    }

    setSteps(newSteps: Array<string>) {
        console.log({ newSteps });
        this._store.steps = newSteps;
    }

    /**
     * Old Actions
     */
    setInitPrompt(newInitPrompt: string) {
        this._store.initPrompt = newInitPrompt;
    }

    setSelectedAppId(subtaskIndex: number, selectedId: string) {
        this._store.subTasks[subtaskIndex].selectedAppId = selectedId;
    }

    setIsSetupComplete(subtaskIndex: number, isComplete: boolean) {
        this._store.subTasks[subtaskIndex].isSetupComplete = isComplete;
    }

    setIsExpanded(subtaskIndex: number, isExpanded: boolean) {
        this._store.subTasks[subtaskIndex].isExpanded = isExpanded;
    }

    setIsOutputsMap(subtaskIndex: number, newOutputsMap: Record<string, any>) {
        this._store.subTasks[subtaskIndex].outputVals = newOutputsMap;
    }

    setSubtasks(inputSubtasks: Array<SubtaskInterface>) {
        this._store.subTasks = inputSubtasks.map((inputSubtask: Object) => ({
            taskName: inputSubtask['step'],
            taskDescription: null,
            optionAppIds: [inputSubtask['project_id']],
            optionAppDetails: null,
            selectedAppId: null,
            inputsMap: {},
            manualInputs: {},
            outputVals: null,
            isSetupComplete: false,
            isExpanded: false,
        }));
    }
}
