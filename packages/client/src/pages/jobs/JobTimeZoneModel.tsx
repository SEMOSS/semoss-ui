import { Stack, RadioGroup, Typography, Autocomplete, TextField } from "@semoss/ui";
import { useState, useEffect } from "react";
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
        if (!Number.isNaN(cronValues[3]) || cronValues[3] == "*") {
            setCronDayOfMonth(cronValues[3]);
        }
        if (!Number.isNaN(cronValues[4]) || cronValues[4] == "*") {
            setCronMonth(cronValues[4]);
        }
        if (!Number.isNaN(cronValues[5]) || cronValues[5] == "?") {
            setCronDayOfWeek(cronValues[5]);
        }
    }, []);
    useEffect(() => {
        setBuilderField(
            "cronExpression",
            `0 ${cronMinute} ${cronHour} ${cronDayOfMonth} ${cronMonth} ${cronDayOfWeek} *`,
        );
    }, [cronMinute, cronHour, cronDayOfMonth, cronMonth, cronDayOfWeek]);

    return (
        <Stack>
            {jobType === "Standard" &&
                <Stack>
                    <Stack direction="row" gap={5}>
                        <Stack width="100%">
                            <Typography variant={"subtitle1"} color="secondary">Time Zone</Typography>
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
                            <Typography variant={"subtitle1"} color="secondary">Frequency</Typography>
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
                        <Typography variant={"subtitle1"} color="secondary">Time</Typography>
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
                            <Typography variant={"subtitle1"} color="secondary">Time Zone</Typography>
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
                            <Typography variant={"subtitle1"} color="secondary">Minute</Typography>
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
                            <Typography variant={"subtitle1"} color="secondary">Hours</Typography>
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
                            <Typography variant={"subtitle1"} color="secondary">Day of Month</Typography>
                            <Autocomplete
                                multiple={false}
                                value={cronDayOfMonth}
                                options={daysOfMonth}
                                onChange={(_, value) =>
                                    setCronDayOfMonth(value)
                                }
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
                            <Typography variant={"subtitle1"} color="secondary">Month</Typography>
                            <Autocomplete
                                multiple={false}
                                value={cronMonth}
                                options={Months.map((m) => `${m.month}`)}
                                onChange={(_, value) =>
                                    setCronMonth(value)
                                }
                                size="small"
                                getOptionLabel={(option: string) =>
                                    option.replaceAll("_", " ")
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
                            <Typography variant={"subtitle1"} color="secondary">Day of Week</Typography>
                            <Autocomplete
                                multiple={false}
                                value={cronDayOfWeek}
                                options={DaysOfWeek.map((d) => `${d.day}`)}
                                onChange={(_, value) =>
                                    setCronDayOfWeek(value)
                                }
                                size="small"
                                getOptionLabel={(option: string) =>
                                    option.replaceAll("_", " ")
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
                        <Typography variant={"subtitle1"} color="secondary">Cron Time Zone</Typography>
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
                        <Typography variant={"subtitle1"} color="secondary">Cron Expression</Typography>
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