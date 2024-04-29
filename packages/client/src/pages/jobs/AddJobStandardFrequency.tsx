import { useEffect, useMemo, useState } from 'react';
import { Stack, TextField } from '@semoss/ui';
import { JobBuilder } from './AddJobModal';
import { Autocomplete } from '@mui/material';
import { DaysOfWeek, FrequencyOptions, Months } from './job.constants';
import { DayOfWeek, Frequencies, Month } from './jobs.types';

export const AddJobStandardFrequency = (props: { builder: JobBuilder }) => {
    const { builder } = props;

    const [frequency, setFrequency] = useState<Frequencies>('Daily');
    const [time, setTime] = useState<string>('12:00');
    const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Sunday');
    const [dayOfMonth, setDayOfMonth] = useState<number>(1);
    const [month, setMonth] = useState<Month>('January');

    useEffect(() => {
        const cronValues = builder.cronExpression.split(' ');
        if (cronValues.length < 5) {
            // make sure it's valid cron syntax
            return;
        } else if (Number.isNaN(cronValues[0]) || Number.isNaN(cronValues[1])) {
            // make sure there's a valid numbered time
            return;
        }

        // set time
        setTime(
            `${cronValues[1] == '0' ? '00' : cronValues[1]}:${
                cronValues[0] == '0' ? '00' : cronValues[0]
            }`,
        );

        // check frequency type
        if (
            cronValues[2] == '*' &&
            cronValues[3] == '*' &&
            cronValues[4] == '*'
        ) {
            setFrequency('Daily');
        } else if (cronValues[2] == '*' && cronValues[3] == '*') {
            setFrequency('Weekly');
            const dayOfWeekValue = parseInt(cronValues[4]);
            const dayOfWeekRecord = DaysOfWeek.find(
                (record) => record.value == dayOfWeekValue,
            );
            if (dayOfWeekRecord) {
                setDayOfWeek(dayOfWeekRecord.day);
            }
        } else if (cronValues[3] == '*' && cronValues[4] == '*') {
            setFrequency('Monthly');
            const dayOfMonthValue = parseInt(cronValues[2]);
            if (dayOfMonthValue <= 31 && dayOfMonthValue >= 1) {
                setDayOfMonth(dayOfMonthValue);
            }
        } else if (cronValues[4] == '*') {
            setFrequency('Yearly');
            const dayOfMonthValue = parseInt(cronValues[2]);
            if (dayOfMonthValue <= 31 && dayOfMonthValue >= 1) {
                setDayOfMonth(dayOfMonthValue);
            }
            const monthValue = parseInt(cronValues[3]);
            const monthRecord = Months.find(
                (record) => record.value == monthValue,
            );
            if (monthRecord) {
                setMonth(monthRecord.month);
            }
        }
    }, [builder.cronExpression]);

    const daysInMonth: number | null = useMemo(() => {
        const monthRecord = Months.find((record) => record.month == month);
        if (monthRecord) {
            return monthRecord.days;
        } else {
            return 31;
        }
    }, [month]);

    return (
        <Stack spacing={1} width="100%">
            <Autocomplete
                size="small"
                options={FrequencyOptions}
                value={frequency}
                renderInput={(params) => {
                    return <TextField {...params} label="Frequency" />;
                }}
                fullWidth
                onChange={(_, value) => setFrequency(value)}
            />
            {frequency == 'Weekly' ? (
                <Autocomplete
                    size="small"
                    options={DaysOfWeek.map((record) => record.day)}
                    value={dayOfWeek}
                    renderInput={(params) => {
                        return <TextField {...params} label="Day of Week" />;
                    }}
                    fullWidth
                    onChange={(_, value) => setDayOfWeek(value)}
                />
            ) : (
                <></>
            )}
            {frequency == 'Yearly' ? (
                <Autocomplete
                    size="small"
                    options={Months.map((record) => record.month)}
                    value={month}
                    renderInput={(params) => {
                        return <TextField {...params} label="Month" />;
                    }}
                    fullWidth
                    onChange={(_, value) => setMonth(value)}
                />
            ) : (
                <></>
            )}
            {frequency == 'Monthly' || frequency == 'Yearly' ? (
                <TextField
                    size="small"
                    value={isNaN(dayOfMonth) ? '' : dayOfMonth}
                    type="number"
                    label="Day of Month"
                    error={
                        dayOfMonth
                            ? !(dayOfMonth <= daysInMonth && dayOfMonth > 0)
                            : false
                    }
                    fullWidth
                    onChange={(e) =>
                        setDayOfMonth(parseInt(e.target.value) ?? 0)
                    }
                />
            ) : (
                <></>
            )}
            <TextField
                label="Time"
                size="small"
                value={time}
                type="time"
                fullWidth
                onChange={(e) => setTime(e.target.value)}
            />
        </Stack>
    );
};
