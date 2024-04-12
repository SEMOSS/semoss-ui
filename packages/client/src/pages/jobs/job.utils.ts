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
