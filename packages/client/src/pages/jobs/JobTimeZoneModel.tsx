import { useState, useEffect } from "react";
import { Stack, RadioGroup, Typography, Autocomplete, TextField } from "@semoss/ui";
import { timezones, FrequencyOptions, Months, DaysOfWeek } from "./job.constants";

export const JobTimeZoneModel = (props: {
    builder: any;
    setBuilderField: (field: string, value: string | string[]) => void;
    jobType: string;
}) => {
    const { builder, setBuilderField, jobType } = props;
    const [selected, setSelected] = useState("semossStart");
    const [time, setTime] = useState<string>("12:00");
    const [cronMinute, setCronMinute] = useState<string>("0");
	const [cronHour, setCronHour] = useState<string>("12");
	const [cronDayOfMonth, setCronDayOfMonth] = useState<string>("*");
	const [cronMonth, setCronMonth] = useState<string>("*");
	const [cronDayOfWeek, setCronDayOfWeek] = useState<string>("?");
    const minutes = Array.from({ length: 60 }, (_, i) => (i + 1).toString());
    const hours = Array.from({ length: 24 }, (_, i) => (i + 1).toString());
    const daysOfMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    useEffect(() => {
        const cronValues = builder.cronExpression.split(" ");
        if (cronValues.length < 6) {
            return;
        }
        if (!Number.isNaN(cronValues[1]) || cronValues[1] == "*") {
            setCronMinute(cronValues[1]);
        }
        if (!Number.isNaN(cronValues[2]) || cronValues[2] == "*") {
            setCronHour(cronValues[2]);
        }
        if (!Number.isNaN(cronValues[4]) || cronValues[4] == "*") {
            setCronMonth(cronValues[4]);
        }
        
        // Handle mutual exclusivity between day-of-month and day-of-week
        const dayOfMonth = cronValues[3];
        const dayOfWeek = cronValues[5];
        
        if (dayOfMonth && dayOfMonth !== "*" && dayOfMonth !== "?") {
            // If day-of-month is specified, set day-of-week to ?
            setCronDayOfMonth(dayOfMonth);
            setCronDayOfWeek("?");
        } else if (dayOfWeek && dayOfWeek !== "*" && dayOfWeek !== "?") {
            // If day-of-week is specified, set day-of-month to ?
            setCronDayOfWeek(dayOfWeek);
            setCronDayOfMonth("?");
        } else {
            // Default case: set values as they are
            setCronDayOfMonth(dayOfMonth || "*");
            setCronDayOfWeek(dayOfWeek || "?");
        }
    }, []);
    
    useEffect(() => {
        setBuilderField(
            "cronExpression",
            `0 ${cronMinute} ${cronHour} ${cronDayOfMonth} ${cronMonth} ${cronDayOfWeek}`,
        );
    }, [cronMinute, cronHour, cronDayOfMonth, cronMonth, cronDayOfWeek]);

    return (
        <Stack>
            {jobType === "Standard" &&
                <Stack>
                    <Stack direction="row" gap={5}>
                        <Stack width="100%">
                            <Typography variant={"subtitle1"} color="textSecondary">Time Zone</Typography>
                            <Autocomplete
                                multiple={false}
                                value={builder.timeZone}
                                options={timezones}
                                onChange={(_, value) =>
                                    setBuilderField("timeZone", value)
                                }
                                size="small"
                                getOptionLabel={(option: string) =>
                                    option.replaceAll("_", " ")
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        placeholder="Select Timezone"
                                    />
                                )}
                            />
                        </Stack>
                        <Stack width="100%">
                            <Typography variant={"subtitle1"} color="textSecondary">Frequency</Typography>
                            <Autocomplete
                                multiple={false}
                                value={builder.frequency}
                                options={FrequencyOptions}
                                onChange={(_, value) =>
                                    setBuilderField("frequency", value)
                                }
                                size="small"
                                getOptionLabel={(option: string) =>
                                    option.replaceAll("_", " ")
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        placeholder="Select Frequency"
                                    />
                                )}
                            />
                        </Stack>
                    </Stack>
                    <Stack width="100%">
                        <Typography variant={"subtitle1"} color="textSecondary">Time</Typography>
                        <TextField
                            placeholder="Select Time"
                            size="small"
                            value={time}
                            type="time"
                            fullWidth
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </Stack>
                </Stack>
            }
            {jobType === "Custom" &&
                <Stack>
                    <RadioGroup
                        name="timeZone"
                        value={selected}
                        onChange={(event) => setSelected(event.target.value)}
                    >
                        <Stack direction="row">
                            <RadioGroup.Item value="dropdown" label="Use Dropdown For Schedule" />
                            <RadioGroup.Item value="Custom" label="Custom Cron Expression" />
                        </Stack>
                        <Stack>
                            <RadioGroup.Item value="semossStart" label="Execute Jobs Each Time Semoss Starts" />
                        </Stack>
                    </RadioGroup>
                </Stack>
            }
            {selected === "dropdown" && jobType === "Custom" && (
                <Stack>
                    <Stack direction="row" gap={5}>
                        <Stack width="100%">
                            <Typography variant={"subtitle1"} color="textSecondary">Time Zone</Typography>
                            <Autocomplete
                                multiple={false}
                                value={builder.timeZone}
                                options={timezones}
                                onChange={(_, value) =>
                                    setBuilderField("timeZone", value)
                                }
                                size="small"
                                getOptionLabel={(option: string) =>
                                    option.replaceAll("_", " ")
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        placeholder="Select Timezone"
                                    />
                                )}
                            />
                        </Stack>
                        <Stack width="100%">
                            <Typography variant={"subtitle1"} color="textSecondary">Minute</Typography>
                            <Autocomplete
                                multiple={false}
                                value={cronMinute}
                                options={minutes}
                                onChange={(_, value) =>
                                    setCronMinute(value ?? "0")
                                }
                                size="small"
                                getOptionLabel={(option: string) =>
                                    option.replaceAll("_", " ")
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        placeholder="Select Minute"
                                    />
                                )}
                            />
                        </Stack>
                    </Stack>
                    <Stack direction="row" gap={5}>
                        <Stack width="100%">
                            <Typography variant={"subtitle1"} color="textSecondary">Hours</Typography>
                            <Autocomplete
                                multiple={false}
                                value={cronHour}
                                options={hours}
                                onChange={(_, value) =>
                                    setCronHour(value)
                                }
                                size="small"
                                getOptionLabel={(option: string) =>
                                    option.replaceAll("_", " ")
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        placeholder="Select Hour"
                                    />
                                )}
                            />
                        </Stack>
                        <Stack width="100%">
                            <Typography variant={"subtitle1"} color="textSecondary">Day of Month</Typography>
                            <Autocomplete
                                multiple={false}
                                value={cronDayOfMonth}
                                options={daysOfMonth}
                                onChange={(_, value) => {
                                    setCronDayOfMonth(value ?? "*");
                                    // If a specific day of month is selected, set day of week to ?
                                    if (value && value !== "*") {
                                        setCronDayOfWeek("?");
                                    }
                                }}
                                size="small"
                                getOptionLabel={(option: string) =>
                                    option.replaceAll("_", " ")
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        placeholder="Select Day of Month"
                                    />
                                )}
                            />
                        </Stack>
                    </Stack>
                    <Stack direction="row" gap={5}>
                        <Stack width="100%">
                            <Typography variant={"subtitle1"} color="textSecondary">Month</Typography>
                            <Autocomplete
                                multiple={false}
                                value={cronMonth}
                                options={Months}
                                onChange={(_, value) =>
                                    setCronMonth(value && typeof value === 'object' ? `${value.value}` : "*")
                                }
                                size="small"
                                getOptionLabel={(option) =>
                                    typeof option === 'string' ? option : option.month
                                }
                                isOptionEqualToValue={(option, value) =>
                                    (typeof option === 'string' ? option : `${option.value}`) === value
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        placeholder="Select Month"
                                    />
                                )}
                            />
                        </Stack>
                        <Stack width="100%">
                            <Typography variant={"subtitle1"} color="textSecondary">Day of Week</Typography>
                            <Autocomplete
                                multiple={false}
                                value={cronDayOfWeek}
                                options={DaysOfWeek}
                                onChange={(_, value) => {
                                    const dayOfWeekValue = value && typeof value === 'object' ? `${value.value}` : "?";
                                    setCronDayOfWeek(dayOfWeekValue);
                                    // If a specific day of week is selected, set day of month to ?
                                    if (value && typeof value === 'object') {
                                        setCronDayOfMonth("?");
                                    }
                                }}
                                size="small"
                                getOptionLabel={(option) =>
                                    typeof option === 'string' ? option : option.day
                                }
                                isOptionEqualToValue={(option, value) =>
                                    (typeof option === 'string' ? option : `${option.value}`) === value
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        placeholder="Select Day of Week"
                                    />
                                )}
                            />
                        </Stack>
                    </Stack>
                </Stack>
            )}
            {selected === "Custom" && jobType === "Custom" && (
                <Stack>
                    <Stack>
                        <Typography variant={"subtitle1"} color="textSecondary">Cron Time Zone</Typography>
                        <Autocomplete
                            multiple={false}
                            value={builder.cronTz}
                            options={timezones}
                            onChange={(_, value) =>
                                setBuilderField("cronTz", value)
                            }
                            size="small"
                            getOptionLabel={(option: string) =>
                                option.replaceAll("_", " ")
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    placeholder="Select Cron Time Zone"
                                />
                            )}
                        />
                    </Stack>
                    <Stack width="100%">
                        <Typography variant={"subtitle1"} color="textSecondary">Cron Expression</Typography>
                        <TextField
                            size="small"
                            value={builder.cronExpression}
                            onChange={(e) => setBuilderField("cronExpression", e.target.value)}
                            multiline
                            rows={3}
                            variant="outlined"
                        />
                    </Stack>
                </Stack>
            )}
        </Stack>
    )
};