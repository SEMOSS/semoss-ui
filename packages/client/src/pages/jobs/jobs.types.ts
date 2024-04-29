export interface PixelReturnJob {
    jobName: string;
    cronExpression: string;
    uiState: string;
    jobId: string;
    PREV_FIRE_TIME: string;
    NEXT_FIRE_TIME: string;
    recipe: string;
    USER_ID: string;
    jobGroup: string;
    recipeParameters: string;
    jobTags: string;
    cronTz: string;
}

export interface JobUIState {
    jobType: string;
    jobName: string;
    cronExpression: string;
    cronTimeZone: string;
    recipe: string;
    recipeParameters: string;
    hour: number;
    minute: string;
    ampm: 'AM' | 'PM';
    frequency: {
        computer: number;
        human: string;
    };
    dayOfWeek:
        | 'Sunday'
        | 'Monday'
        | 'Tuesday'
        | 'Wednesday'
        | 'Thursday'
        | 'Friday'
        | 'Saturday';
    dayOfMonth: number;
    monthOfyear:
        | 'January'
        | 'February'
        | 'March'
        | 'April'
        | 'May'
        | 'June'
        | 'July'
        | 'August'
        | 'September'
        | 'October'
        | 'November'
        | 'December';
    jobTypeTemplate: object;
    onLoad: boolean;
    jobTags: string[];
    fileName: string;
    filePath: string;
    export_template: string;
    exportAudit: string;
    placeholderData: Array<any>;
    selectedApp: string | null;
    customCron?: boolean;
}

export interface Job {
    id: string;
    name: string;
    type: string;
    frequencyString: string;
    timeZone: string;
    tags: string[];
    lastRun: string;
    nextRun: string;
    ownerId: string;
    isActive: boolean;
    group: string;
}

export interface HistoryJob {
    jobId: string;
    jobName: string;
    jobGroup: string;
    execStart: string;
    execEnd: string;
    execDelta: string;
    success: boolean;
    jobTags: string[];
    isLatest: boolean;
    schedulerOutput: string;
}

export type Frequencies = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export type DayOfWeek =
    | 'Sunday'
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday';

export type Month =
    | 'January'
    | 'February'
    | 'March'
    | 'April'
    | 'May'
    | 'June'
    | 'July'
    | 'August'
    | 'September'
    | 'October'
    | 'November'
    | 'December';
