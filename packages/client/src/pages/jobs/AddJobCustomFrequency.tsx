import { useEffect, useState } from 'react';
import { Stack, TextField } from '@semoss/ui';
import { JobBuilder } from './AddJobModal';

export const AddJobCustomFrequency = (props: { builder: JobBuilder }) => {
    const { builder } = props;

    const [cronMinute, setCronMinute] = useState<string>('0');
    const [cronHour, setCronHour] = useState<string>('12');
    const [cronDayOfMonth, setCronDayOfMonth] = useState<string>('*');
    const [cronMonth, setCronMonth] = useState<string>('*');
    const [cronDayOfWeek, setCronDayOfWeek] = useState<string>('*');

    useEffect(() => {
        const cronValues = builder.cronExpression.split(' ');
        if (cronValues.length < 5) {
            // make sure it's valid cron syntax
            return;
        }
        if (!Number.isNaN(cronValues[0]) || cronValues[0] == '*') {
            setCronMinute(cronValues[0]);
        }
        if (!Number.isNaN(cronValues[1]) || cronValues[1] == '*') {
            setCronHour(cronValues[1]);
        }
        if (!Number.isNaN(cronValues[2]) || cronValues[2] == '*') {
            setCronDayOfMonth(cronValues[2]);
        }
        if (!Number.isNaN(cronValues[3]) || cronValues[3] == '*') {
            setCronMonth(cronValues[3]);
        }
        if (!Number.isNaN(cronValues[4]) || cronValues[4] == '*') {
            setCronDayOfWeek(cronValues[4]);
        }
    }, [builder.cronExpression]);

    return (
        <Stack direction="row" spacing={1} width="100%">
            <TextField
                label="Minute"
                value={cronMinute}
                error={
                    cronMinute !== '*' &&
                    !(
                        !Number.isNaN(cronMinute) &&
                        parseInt(cronMinute) <= 59 &&
                        parseInt(cronMinute) >= 0
                    )
                }
                onChange={(e) => setCronMinute(e.target.value)}
            />
            <TextField
                label="Hour"
                value={cronHour}
                error={
                    cronHour !== '*' &&
                    !(
                        !Number.isNaN(cronHour) &&
                        parseInt(cronHour) <= 23 &&
                        parseInt(cronHour) >= 0
                    )
                }
                onChange={(e) => setCronHour(e.target.value)}
            />
            <TextField
                label="Day of Month"
                value={cronDayOfMonth}
                error={
                    cronDayOfMonth !== '*' &&
                    !(
                        !Number.isNaN(cronDayOfMonth) &&
                        parseInt(cronDayOfMonth) <= 31 &&
                        parseInt(cronDayOfMonth) >= 0
                    )
                }
                onChange={(e) => setCronDayOfMonth(e.target.value)}
            />
            <TextField
                label="Month"
                value={cronMonth}
                error={
                    cronMonth !== '*' &&
                    !(
                        !Number.isNaN(cronMonth) &&
                        parseInt(cronMonth) <= 12 &&
                        parseInt(cronMonth) >= 1
                    )
                }
                onChange={(e) => setCronMonth(e.target.value)}
            />
            <TextField
                label="Day of Week"
                value={cronDayOfWeek}
                error={
                    cronDayOfWeek !== '*' &&
                    !(
                        !Number.isNaN(cronDayOfWeek) &&
                        parseInt(cronDayOfWeek) <= 6 &&
                        parseInt(cronDayOfWeek) >= 0
                    )
                }
                onChange={(e) => setCronDayOfWeek(e.target.value)}
            />
        </Stack>
    );
};
