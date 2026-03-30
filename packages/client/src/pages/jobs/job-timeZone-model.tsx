import { useState, useEffect } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  RadioGroup,
  RadioGroupItem,
  Field,
  FieldContent,
  FieldLabel,
} from "@semoss/ui/next";

import {
  timezones,
  FrequencyOptions,
  Months,
  DaysOfWeek,
} from "./job.constants";

export const JobTimeZoneModel = (props: {
  builder: any;
  setBuilderField: (field: string, value: string | string[]) => void;
  jobType: string;
}) => {
  const { builder, setBuilderField, jobType } = props;

  const [selected, setSelected] = useState("semossStart");
  const [time, setTime] = useState("12:00");

  const [cronMinute, setCronMinute] = useState("0");
  const [cronHour, setCronHour] = useState("12");
  const [cronDayOfMonth, setCronDayOfMonth] = useState("*");
  const [cronMonth, setCronMonth] = useState("*");
  const [cronDayOfWeek, setCronDayOfWeek] = useState("?");

  const minutes = Array.from({ length: 60 }, (_, i) => `${i + 1}`);
  const hours = Array.from({ length: 24 }, (_, i) => `${i + 1}`);
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => `${i + 1}`);

  useEffect(() => {
    const cronValues = builder.cronExpression.split(" ");
    if (cronValues.length < 6) return;

    setCronMinute(cronValues[1] ?? "0");
    setCronHour(cronValues[2] ?? "12");
    setCronMonth(cronValues[4] ?? "*");

    const dayOfMonth = cronValues[3];
    const dayOfWeek = cronValues[5];

    if (dayOfMonth && dayOfMonth !== "*" && dayOfMonth !== "?") {
      setCronDayOfMonth(dayOfMonth);
      setCronDayOfWeek("?");
    } else if (dayOfWeek && dayOfWeek !== "*" && dayOfWeek !== "?") {
      setCronDayOfWeek(dayOfWeek);
      setCronDayOfMonth("?");
    } else {
      setCronDayOfMonth(dayOfMonth || "*");
      setCronDayOfWeek(dayOfWeek || "?");
    }
  }, []);

  useEffect(() => {
    setBuilderField(
      "cronExpression",
      `0 ${cronMinute} ${cronHour} ${cronDayOfMonth} ${cronMonth} ${cronDayOfWeek}`
    );
  }, [cronMinute, cronHour, cronDayOfMonth, cronMonth, cronDayOfWeek]);

  return (
    <div className="flex flex-col gap-6">

      {jobType === "Standard" && (
        <>
          <div className="flex gap-5">

            <Field className="w-full">
              <FieldLabel>Time Zone</FieldLabel>
              <FieldContent>
                <Select
                  value={builder.cronTz}
                  onValueChange={(v) => setBuilderField("cronTz", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz: string) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field className="w-full">
              <FieldLabel>Frequency</FieldLabel>
              <FieldContent>
                <Select
                  value={builder.frequency}
                  onValueChange={(v) => setBuilderField("frequency", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FrequencyOptions.map((f: string) => (
                      <SelectItem key={f} value={f}>
                        {f.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

          </div>

          <Field>
            <FieldLabel>Time</FieldLabel>
            <FieldContent>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </FieldContent>
          </Field>
        </>
      )}

      {jobType === "Custom" && (
        <Field>
          <FieldLabel>Schedule Type</FieldLabel>
          <FieldContent>
            <RadioGroup value={selected} onValueChange={setSelected}>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dropdown" />
                  <span>Use Dropdown For Schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Custom" />
                  <span>Custom Cron Expression</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <RadioGroupItem value="semossStart" />
                <span>Execute Jobs Each Time Semoss Starts</span>
              </div>
            </RadioGroup>
          </FieldContent>
        </Field>
      )}

      {selected === "dropdown" && jobType === "Custom" && (
        <div className="flex flex-col gap-5">

          <div className="flex gap-5">
            <Field className="w-full">
              <FieldLabel>Time Zone</FieldLabel>
              <FieldContent>
                <Select
                  value={builder.cronTz}
                  onValueChange={(v) => setBuilderField("cronTz", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz: string) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field className="w-full">
              <FieldLabel>Minute</FieldLabel>
              <FieldContent>
                <Select
                  value={cronMinute}
                  onValueChange={(v) => setCronMinute(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Minute" />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </div>

          <div className="flex gap-5">
            <Field className="w-full">
              <FieldLabel>Hour</FieldLabel>
              <FieldContent>
                <Select value={cronHour} onValueChange={setCronHour}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field className="w-full">
              <FieldLabel>Day of Month</FieldLabel>
              <FieldContent>
                <Select
                  value={cronDayOfMonth}
                  onValueChange={(v) => {
                    setCronDayOfMonth(v);
                    if (v !== "*") setCronDayOfWeek("?");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfMonth.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </div>

          <div className="flex gap-5">
            <Field className="w-full">
              <FieldLabel>Month</FieldLabel>
              <FieldContent>
                <Select
                  value={cronMonth}
                  onValueChange={(v) => setCronMonth(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Months.map((m: any) => (
                      <SelectItem key={m.value} value={`${m.value}`}>
                        {m.month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field className="w-full">
              <FieldLabel>Day of Week</FieldLabel>
              <FieldContent>
                <Select
                  value={cronDayOfWeek}
                  onValueChange={(v) => {
                    setCronDayOfWeek(v);
                    setCronDayOfMonth("?");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DaysOfWeek.map((d: any) => (
                      <SelectItem key={d.value} value={`${d.value}`}>
                        {d.day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </div>
        </div>
      )}

      {selected === "Custom" && jobType === "Custom" && (
        <div className="flex flex-col gap-5">

          <Field>
            <FieldLabel>Cron Time Zone</FieldLabel>
            <FieldContent>
              <Select
                value={builder.cronTz}
                onValueChange={(v) => setBuilderField("cronTz", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz: string) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Cron Expression</FieldLabel>
            <FieldContent>
              <Textarea
                rows={3}
                value={builder.cronExpression}
                onChange={(e) =>
                  setBuilderField("cronExpression", e.target.value)
                }
              />
            </FieldContent>
          </Field>

        </div>
      )}
    </div>
  );
};