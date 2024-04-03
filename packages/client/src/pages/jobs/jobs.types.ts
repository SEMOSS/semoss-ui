export type Day =
    'Sunday' |
    'Monday' |
    'Tuesday' |
    'Wednesday' |
    'Thursday' |
    'Friday' |
    'Saturday';

export type Month =
    'January' |
    'February' |
    'March' |
    'April' |
    'May' |
    'June' |
    'July' |
    'August' |
    'September' |
    'October' |
    'Novermber' |
    'December';

export interface Job {
    jobId?: string;
    jobGroup?: string;
    jobName: string;
    jobType: 'Custom Job'|'Sync Database'|'Backup Database'|'Extract Transform Load'|'Send Email'|'Run Insight';
    jobTags: string;
    onLoad: boolean;
    customCron: boolean;
    cronExpression: string;
    frequency: 'Daily';
    dayOfWeek: Day;
    hour: string;
    minute: string;
    ampm: 'AM'|'PM';
    monthOfYear: Month;
    dayOfMonth: number;
    openExport: boolean;
    fileName: string;
    filePathChecked: boolean;
    filePath: string;
    selectedApp: string;
    exportTemplate: string;
    exportAudit: boolean;
    PREV_FIRE_TIME?: string;
    USER_ID?: string;
};