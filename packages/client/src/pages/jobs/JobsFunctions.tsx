export interface Insight {
    app_id: string;
    app_insight_id: string;
    app_name: string;
    cacheEncrypt: boolean;
    cacheMinutes: number;
    cacheable: boolean;
    cachedOn: string;
    created_on: string;
    description: string;
    insight_global: boolean;
    last_modified_on: string;
    layout: string;
    low_name: string;
    name: string;
    project_global: boolean;
    project_id: string;
    project_insight_id: string;
    project_name: string;
    tags: string[];
    view_count: number;
}

export interface Template {
    templateType: string;
    templateName: string;
    fileName: string;
    templateGroup: string;
}

export interface Job {
    jobName: string;
    jobType: string;
    jobTags: string;
    // frequency stuff
    onLoad: boolean;
    customCron: boolean;
    cronExpression: string;
    frequency: string;
    dayOfWeek: string;
    hour: string;
    minute: string;
    ampm: string;
    monthOfYear: string;
    dayOfMonth: number;
    // export stuff
    openExport: boolean;
    fileName: string;
    filePathChecked: boolean;
    filePath: string;
    exportTemplate: string;
    exportAudit: boolean;
    selectedApp: string;
}

export interface CustomJob extends Job {
    jobType: 'Custom Job';
    recipe: string;
}

export interface SyncDatabaseJob extends Job {
    jobType: 'Sync Database';
    app: string; // project name
    repository: string;
    username: string;
    password: string;
    dual: boolean; // dual
    syncDatabase: boolean;
}

export interface BackupDatabaseJob extends Job {
    jobType: 'Backup Database';
    app: string; // database name
}

export interface ExtractTransformLoadJob extends Job {
    jobType: 'Extract Transform Load';
    sourceApp: string;
    targetApp: string;
    targetTable: string;
    query: string;
}

export interface SendEmailJob extends Job {
    jobType: 'Send Email';
    smtpHost: string;
    smtpPort: string;
    subject: string;
    to: string; // can be multiple - separated by semicolon
    from: string;
    message: string;
    username: string;
    password: string;
}

export interface RunInsightJob extends Job {
    jobType: 'Run Insight';
    app: string; // project name
    insight: string;
}

export type JobData =
    | CustomJob
    | SyncDatabaseJob
    | BackupDatabaseJob
    | ExtractTransformLoadJob
    | SendEmailJob
    | RunInsightJob;

export const monthsOfYear = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

export const frequencyOpts = [
    {
        computer: 1,
        human: 'Daily',
    },
    {
        computer: 2,
        human: 'Weekly',
    },
    {
        computer: 3,
        human: 'Monthly',
    },
    {
        computer: 4,
        human: 'Quarterly',
    },
    {
        computer: 5,
        human: 'Yearly',
    },
];

export function getDaysOfMonth(month: string) {
    switch (month) {
        case 'February':
            return [...Array(28).keys()].map((x) => String(++x));
        case 'April':
        case 'June':
        case 'September':
        case 'November':
            return [...Array(30).keys()].map((x) => String(++x));
        default:
            return [...Array(31).keys()].map((x) => String(++x));
    }
}

export function convertTimeToFrequencyString(job) {
    let freq;
    let timeStr;
    if (!job.customCron) {
        freq = job.frequency.computer;
        timeStr = job.frequency.human;

        if (freq === 2) {
            // weekly
            timeStr = timeStr + ' on ' + job.dayOfWeek;
        }

        if (freq === 3) {
            // monthly
            timeStr = timeStr + ' on the ' + job.dayOfMonth;
            const monthLastDigit = job.dayOfMonth
                    .toString()
                    .substring(
                        job.dayOfMonth.length - 1,
                        job.dayOfMonth.length,
                    ),
                monthFirstDigit = job.dayOfMonth.toString().substring(0, 1);
            if (
                job.dayOfMonth.toString().length > 1 &&
                (monthFirstDigit === '1' || monthLastDigit === '0')
            )
                timeStr += 'th ';
            else if (monthLastDigit === '1') timeStr += 'st ';
            else if (monthLastDigit === '2') timeStr += 'nd ';
            else if (monthLastDigit === '3') timeStr += 'rd ';
            else timeStr += 'th ';
        }

        if (freq >= 1) {
            // daily
            timeStr = timeStr + ' at ' + job.hour + ':' + job.minute + job.ampm;
        }
    } else {
        timeStr = 'Custom';
    }

    return timeStr;
}

export function convertTimetoDate(time) {
    let today = new Date(),
        dd = String(today.getDate()).padStart(2, '0'),
        mm = String(today.getMonth() + 1).padStart(2, '0'),
        yyyy = today.getFullYear(),
        currentDate = yyyy + '-' + mm + '-' + dd,
        runDateString = '',
        jobDate = time.split(' ')[0],
        jobTime = time.split(' ')[1].split(':'),
        jobHour = Number(jobTime[0]),
        jobMin = jobTime[1];

    if (jobDate === currentDate) {
        runDateString += 'Today at ';
    } else {
        runDateString += jobDate + ' at ';
    }

    if (jobHour > 12)
        runDateString +=
            (jobHour - 12).toString() + ':' + jobMin.toString() + 'pm';
    else if (jobHour === 12) runDateString += '12' + ':' + jobMin + 'pm';
    else if (jobHour === 0) runDateString += '12' + ':' + jobMin + 'am';
    else runDateString += jobHour.toString() + ':' + jobMin + 'am';

    return runDateString;
}

export function convertTimeToLastRunString(job) {
    if (
        !job.PREV_FIRE_TIME ||
        job.PREV_FIRE_TIME === 'N/A' ||
        job.PREV_FIRE_TIME === 'INACTIVE'
    ) {
        return '';
    }

    return convertTimetoDate(job.PREV_FIRE_TIME);
}

export function convertTimeToNextRunString(job) {
    if (job.NEXT_FIRE_TIME === 'INACTIVE') {
        return 'Inactive';
    } else if (job.NEXT_FIRE_TIME === 'EXECUTING') {
        return 'Executing';
    }
    return convertTimetoDate(job.NEXT_FIRE_TIME);
}

export function convertDeltaToRuntimeString(duration) {
    // padding for leading zeros
    function _pad(number: number) {
        let tempNumStr = number + '';

        for (let i = tempNumStr.length; i < 3; i++) {
            tempNumStr = '0' + tempNumStr;
        }

        return tempNumStr;
    }
    let milliseconds = _pad(parseFloat(String((duration % 1000) / 100)) * 100);
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    const hoursStr = hours < 10 ? '0' + hours : hours;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const secondsStr = seconds < 10 ? '0' + seconds : seconds;

    // always have milliseconds a let size
    while (milliseconds.length < 3) {
        milliseconds = milliseconds + '0';
    }
    milliseconds = milliseconds.substring(0, 3);
    return hoursStr + ':' + minutesStr + ':' + secondsStr + '.' + milliseconds;
}

export function convertTimeToCron(job) {
    const freq = job.frequency.computer,
        cronPieces = ['00', '*', '*', '*', '*', '?', '*'];

    const jobHour = String(job.hour);
    if (freq >= 1) {
        cronPieces[1] = job.minute;
        if (job.ampm === 'AM') {
            if (jobHour === '12') {
                cronPieces[2] = '0';
            } else {
                cronPieces[2] = jobHour;
            }
        } else if (jobHour === '12') {
            cronPieces[2] = '12';
        } else {
            cronPieces[2] = String(Number(jobHour) + 12);
        }
    }

    if (freq === 2) {
        cronPieces[3] = '?';
        cronPieces[5] = job.dayOfWeek.substr(0, 3).toUpperCase();
    }

    if (freq === 3) {
        // cronPieces[3] = '1/' + job.dayOfMonth;
        cronPieces[3] = job.dayOfMonth;
    }

    if (freq === 4) {
        cronPieces[3] = job.dayOfMonth;
        cronPieces[4] = `${monthsOfYear.indexOf(job.monthOfYear) + 1}/3`;
    }

    if (freq === 5) {
        cronPieces[3] = job.dayOfMonth;
        cronPieces[4] = String(monthsOfYear.indexOf(job.monthOfYear) + 1);
    }

    return cronPieces.join(' ');
}

export function buildBackupDatabaseQuery(appId: string) {
    return `BackupDatabase("${appId}");`;
}

export function buildSyncDatabaseQuery(
    appId: string,
    repository: string,
    username: string,
    password: string,
    dual: boolean,
    syncDatabase: boolean,
) {
    let syncAppQuery = 'SyncApp(';

    syncAppQuery += "app=['" + appId + "'], ";
    syncAppQuery += "repository=['" + repository + "'], ";
    syncAppQuery += "username=['" + username + "'], ";
    syncAppQuery += "password=['" + password + "'], ";
    syncAppQuery += "dual=['" + dual + "'], ";
    syncAppQuery += "syncDatabase=['" + syncDatabase + "']);";
    return syncAppQuery;
}

export function buildETLQuery(
    sourceAppId: string,
    query: string,
    targetAppId: string,
    targetTable: string,
) {
    let etlQuery = 'Database(database=["';
    etlQuery +=
        sourceAppId +
        '"]) | Query("' +
        query +
        '") | ToDatabase(targetDatabase=["' +
        targetAppId +
        '"] , targetTable=["' +
        targetTable +
        '"], overwrite=[true]);';
    return etlQuery;
}
