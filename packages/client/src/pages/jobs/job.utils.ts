import { JobUIState } from './jobs.types';

export function convertTimeToFrequencyString(job: JobUIState) {
    if (!job?.customCron) {
        let freq = job.frequency.computer;
        let timeStr = job.frequency.human;

        if (freq === 2) {
            // weekly
            timeStr = timeStr + ' on ' + job.dayOfWeek;
        }

        if (freq === 3) {
            // monthly
            timeStr = timeStr + ' on the ' + job.dayOfMonth;
            const dayOfMonthString = job.dayOfMonth.toString();
            const monthLastDigit = dayOfMonthString.substring(
                    dayOfMonthString.length - 1,
                    dayOfMonthString.length,
                ),
                monthFirstDigit = dayOfMonthString.substring(0, 1);
            if (
                dayOfMonthString.length > 1 &&
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

        return timeStr;
    } else {
        return 'Custom';
    }
}
