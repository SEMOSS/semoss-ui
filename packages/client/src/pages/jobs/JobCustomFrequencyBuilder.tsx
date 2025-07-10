import { useEffect, useState } from 'react';
import { Stack, TextField } from '@semoss/ui';
import { JobBuilder } from './job.types';

// Helper for default values
const DEFAULT_CRON = ['0', '0', '12', '?', '*', '?', '*'];
const CRON_LABELS = [
  'Seconds',
  'Minutes',
  'Hours',
  'Day of Month',
  'Month',
  'Day of Week',
  'Year',
];

// Regex patterns for cron fields
const CRON_PATTERNS: RegExp[] = [
  /^(\*|(?:\*|(?:[0-9]|(?:[1-5][0-9])))\/(?:[0-9]|(?:[1-5][0-9]))|(?:[0-9]|(?:[1-5][0-9]))(?:(?:\-[0-9]|\-(?:[1-5][0-9]))?|(?:\,(?:[0-9]|(?:[1-5][0-9])))*))$/, // Seconds: 0-59
  /^(\*|(?:\*|(?:[0-9]|(?:[1-5][0-9])))\/(?:[0-9]|(?:[1-5][0-9]))|(?:[0-9]|(?:[1-5][0-9]))(?:(?:\-[0-9]|\-(?:[1-5][0-9]))?|(?:\,(?:[0-9]|(?:[1-5][0-9])))*))$/, // Minutes: 0-59
  /^(\*|(?:\*|(?:\*|(?:[0-9]|1[0-9]|2[0-3])))\/(?:[0-9]|1[0-9]|2[0-3])|(?:[0-9]|1[0-9]|2[0-3])(?:(?:\-(?:[0-9]|1[0-9]|2[0-3]))?|(?:\,(?:[0-9]|1[0-9]|2[0-3]))*))$/, // Hours: 0-23
  /^(\*|\?|L(?:W|\-(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:[1-9]|(?:[12][0-9])|3[01])(?:W|\/(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:[1-9]|(?:[12][0-9])|3[01])(?:(?:\-(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:\,(?:[1-9]|(?:[12][0-9])|3[01]))*))$/, // Day of Month: 1-31, ?
  /^(\*|(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:\-(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?|(?:\,(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))*))$/, // Month: 1-12
  /^(\*|\?|[0-6](?:L|\#[1-5])?|(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT)(?:(?:\-(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT))?|(?:\,(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT))*))$/, // Day of Week: 0-6, ?
  /^(\*|(?:[1-9][0-9]{3})(?:(?:\-[1-9][0-9]{3})?|(?:\,[1-9][0-9]{3})*))$/, // Year: 1000-9999
];

export const JobCustomFrequencyBuilder = (props: {
  builder: JobBuilder;
  setBuilderField: (field: string, value: string | string[]) => void;
}) => {
  const { builder, setBuilderField } = props;

  // Initialize state for each cron field
  const [cronFields, setCronFields] = useState<string[]>(DEFAULT_CRON);

  // On mount or when builder.cronExpression changes, sync state from builder
  useEffect(() => {
    const fields = builder.cronExpression?.split(' ') ?? [];
    while (fields.length < 7) fields.push('*');
    setCronFields(fields.slice(0, 7));
    // eslint-disable-next-line
  }, [builder.cronExpression]);

  // When any cron field changes, update the builder's cronExpression
  useEffect(() => {
    setBuilderField('cronExpression', cronFields.join(' '));
    // eslint-disable-next-line
  }, [cronFields.join(' ')]);

  // Validation logic for each field, now supports *, ?, ranges, and lists
  const getError = (idx: number, value: string) => {
    const pattern = CRON_PATTERNS[idx];
    return !pattern.test(value);
  };

  // Handler for field changes
  const handleFieldChange = (idx: number, value: string) => {
    const newFields = [...cronFields];
    newFields[idx] = value;
    setCronFields(newFields);
  };

  return (
    <Stack direction="row" spacing={1} width="100%">
      {CRON_LABELS.map((label, idx) => (
        <TextField
          key={label}
          label={label}
          value={cronFields[idx]}
          error={getError(idx, cronFields[idx])}
          onChange={e => handleFieldChange(idx, e.target.value)}
        />
      ))}
    </Stack>
  );
};
