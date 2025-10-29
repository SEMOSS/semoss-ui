import { useState, useMemo } from "react";
import { useSettings } from "@/hooks";
import { Stack, Typography, RadioGroup, Button, styled, useNotification } from "@semoss/ui";
import { runPixel } from "@semoss/sdk/react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import type { JobBuilder, } from "./job.types";
import { JobTypeCustomJob, JobTypeSendEmail, } from "./job.constants";
import { JobTimeZoneModel } from "./JobTimeZoneModel";
import { JobDetailsModel } from "./JobDetailsModel";
import { getEncodeByJobType } from "./job.utils";

const emptyBuilder: JobBuilder = {
    formType: "",
    id: null,
    name: "",
    pixel: "",
    basicTz: "",
    tags: [],
    cronExpression: "0 0 12 * * ?",
    cronTz: "",
    smtpHost: "",
    smtpPort: "",
    subject: "",
    jobType: "",
    to: [],
    cc: [],
    bcc: [],
    from: "",
    message: "",
    username: "",
    password: "",
};

const StyledButtonBack = styled(Button)(() => ({
    background: "transparent",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    color: "#666",
    marginRight: "5px",
    width: "10%",
}));
const StyledButtonAdd = styled(Button)(() => ({
    background: "#007AFF",
    color: "#fff",
    fontSize: "14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginRight: "5px",
    width: "10%",
}));

export const AddNewJob= (props: {
	isOpen: boolean;
	close: () => void;
	getJobs: () => void;
	initialBuilder?: JobBuilder;
}) => {
    const { adminMode } = useSettings();
    const notification = useNotification();
    const location = useLocation();
    
    if (!adminMode) {
            return <Navigate to={"/settings"} />;
    }
    const { isOpen, close, getJobs, initialBuilder } = props;
    const initialBuilderFromLocation = (location.state as { initialState?: JobBuilder } | undefined)?.initialState;
    const [builder, setBuilder] = useState<JobBuilder>(
        initialBuilderFromLocation ?? emptyBuilder
    );
    const [timeZoneType, setTimeZoneType] = useState("Standard");
    const navigate = useNavigate();

    const setBuilderField = (field: string, value: string | string[]) => {
        setBuilder((previousBuilder) => ({
            ...previousBuilder,
            [field]: value,
        }));
    };

    const isCronExpressionValid: boolean = useMemo(() => {
            const cronValues = builder.cronExpression.split(" ");
            if (cronValues.length < 6) {
                // make sure it's valid cron syntax
                return false;
            }
            if (
                cronValues[1] !== "*" &&
                !(
                    !Number.isNaN(cronValues[1]) &&
                    parseInt(cronValues[1]) <= 59 &&
                    parseInt(cronValues[1]) >= 0
                )
            ) {
                return false;
            }
            if (
                cronValues[2] !== "*" &&
                !(
                    !Number.isNaN(cronValues[2]) &&
                    parseInt(cronValues[2]) <= 23 &&
                    parseInt(cronValues[2]) >= 0
                )
            ) {
                return false;
            }
            if (
                cronValues[3] !== "*" &&
                !(
                    !Number.isNaN(cronValues[3]) &&
                    parseInt(cronValues[3]) <= 31 &&
                    parseInt(cronValues[3]) >= 0
                )
            ) {
                return false;
            }
            if (
                cronValues[4] !== "*" &&
                !(
                    !Number.isNaN(cronValues[4]) &&
                    parseInt(cronValues[4]) <= 12 &&
                    parseInt(cronValues[4]) >= 1
                )
            ) {
                return false;
            }
            if (
                cronValues[5] !== "?" &&
                !(
                    !Number.isNaN(cronValues[5]) &&
                    parseInt(cronValues[5]) <= 6 &&
                    parseInt(cronValues[5]) >= 0
                )
            ) {
                return false;
            }
            return true;
        }, [builder.cronExpression]);
    
        const isBaseFormValid: boolean = useMemo(() => {
            switch (builder.jobType) {
                case JobTypeSendEmail:
                    return (
                        !!builder.formType &&
                        !!builder.name &&
                        !!builder.smtpHost &&
                        !!builder.smtpPort &&
                        !!builder.subject &&
                        !!builder.jobType &&
                        !!builder.to &&
                        !!builder.from &&
                        !!builder.message &&
                        !!builder.username &&
                        !!builder.password &&
                        !!builder.cronTz
                    );
                case JobTypeCustomJob:
                    return !!builder.name && !!builder.pixel && !!builder.cronTz;
            }
        }, [
            builder.name,
            builder.pixel,
            builder.cronTz,
            builder.smtpHost,
            builder.smtpPort,
            builder.subject,
            builder.jobType,
            builder.to,
            builder.from,
            builder.message,
            builder.username,
            builder.password,
        ]);

    const hasChanges: boolean = useMemo(() => {
            if (builder.id == null) {
                return true;
            }
    
            return (
                builder.formType !== initialBuilder?.formType ||
                builder.name !== initialBuilder.name ||
                builder.pixel !== initialBuilder.pixel ||
                JSON.stringify(builder.tags) !==
                    JSON.stringify(initialBuilder.tags) ||
                builder.cronTz !== initialBuilder.cronTz ||
                builder.cronExpression !== initialBuilder.cronExpression ||
                builder.smtpHost !== initialBuilder.smtpHost ||
                builder.smtpPort !== initialBuilder.smtpPort ||
                builder.subject !== initialBuilder.subject ||
                builder.jobType !== initialBuilder.jobType ||
                JSON.stringify(builder.to) !== JSON.stringify(initialBuilder.to) ||
                JSON.stringify(builder.cc) !== JSON.stringify(initialBuilder.cc) ||
                JSON.stringify(builder.bcc) !==
                    JSON.stringify(initialBuilder.bcc) ||
                builder.from !== initialBuilder.from ||
                builder.message !== initialBuilder.message ||
                builder.username !== initialBuilder.username ||
                builder.password !== initialBuilder.password
            );
        }, [
            builder.name,
            builder.pixel,
            builder.tags,
            builder.cronTz,
            builder.cronExpression,
            builder.smtpHost,
            builder.smtpPort,
            builder.subject,
            builder.jobType,
            builder.to,
            builder.from,
            builder.message,
            builder.username,
            builder.password,
        ]);
    
    const addJob = async () => {
            try {
                const encode = getEncodeByJobType(builder);
                const response = await runPixel(
                    `META|ScheduleJob(jobName=["${builder.name}"],${
                        builder.tags.length
                            ? ` jobTags=${JSON.stringify(builder.tags)},`
                            : ""
                    } jobGroup=["defaultGroup"], cronExpression=["${
                        builder.cronExpression
                    }"], cronTz=["${
                        builder.cronTz
                    }"], recipe=["<encode>${encode}</encode>"], uiState='{"jobType":"${
                        builder.jobType
                    }","jobName":"${builder.name}", "cronExpression":"${
                        builder.cronExpression
                    }","cronTimeZone":"${builder.cronTz}", "recipeParameters":""}',triggerOnLoad=[false],triggerNow=[false]);`,
                );
                if (response.errors.length) {
                    throw new Error(response.errors[0]);
                }
                else {
                    navigate("/settings/jobs");
                }
                notification.add({
                    color: "success",
                    message: "Job added successfully",
                });
            } catch {
                notification.add({
                    color: "error",
                    message: "Unable to add job",
                });
            }
        };
    const updateJob = async () => {
        try{
            const encode = getEncodeByJobType(builder);
            const response = await runPixel(
                `META|EditScheduledJob(jobId="${builder.id}",jobName="${
                    builder.name
                }",${
                    builder.tags.length
                        ? `jobTags=${JSON.stringify(builder.tags)},`
                        : ""
                }jobGroup=["defaultGroup"],cronExpression="${
                    builder.cronExpression
                } *",cronTz="${
                    builder.cronTz
                }",recipe="<encode>${encode}</encode>",uiState='{"jobType":"${
                    builder.jobType
                }", "jobName":"${builder.name}", "cronExpression":"${
                    builder.cronExpression
                }", "cronTimeZone":"${
                    builder.cronTz
                }"}',triggerOnLoad=[false],triggerNow=[false]);`,
            );
            if (response.errors.length) {
                throw new Error(response.errors[0]);
            }
            else {
                navigate("/settings/jobs");
            }
            notification.add({
                color: "success",
                message: "Job Updated successfully",
            });
        } catch{
            notification.add({
                color: "error",
                message: "Unable to update job",
            });
        }
    };
    return (
        <Stack>
            <Stack direction="row" flex={5} gap={11} alignItems="center">
                <Stack>
                    <Typography variant={"h6"}>Select Time Zone</Typography>
                    <Typography variant={"subtitle1"} color="secondary">Please select the time zone for the job you are adding.</Typography>
                </Stack>
                <Stack direction="row" gap={5}>
                    <RadioGroup
                        name="timeZone"
                        value={timeZoneType}
                        onChange={(event) => {
                            setBuilderField("basicTz", event.target.value);
                            setTimeZoneType(event.target.value);
                        }}
                        sx={{ display: "flex", flexDirection: "row", gap: 5 }}
                    >
                        <RadioGroup.Item value="Standard" label="Standard" />
                        <RadioGroup.Item value="Custom" label="Custom" />
                    </RadioGroup>
                </Stack>
            </Stack>
            <div style={{ width: "100%", borderBottom: "1px solid #ccc", marginTop: "50px" }} />
            <Stack direction="row" flex={5} gap={10}>
                <Stack width="41%">
                    <Typography variant={"h6"}>Job Details</Typography>
                    <Typography variant={"subtitle1"} color="secondary">Kindly provide the name, type, pixel and tags to procced with</Typography>
                    <Typography variant={"subtitle1"} color="secondary">adding the new job.</Typography>
                </Stack>
                <Stack width="50%">
                    <JobDetailsModel
                        builder={builder}
                        setBuilderField={setBuilderField}
                    />
                </Stack>
            </Stack>
            <div style={{ width: "100%", borderBottom: "1px solid #ccc", marginTop: "50px" }} />
            <Stack direction="row" flex={5} gap={5} alignItems="center">
                <Stack width="43%">
                    <Typography variant={"h6"}>Job Time</Typography>
                    <Typography variant={"subtitle1"} color="secondary">Kindly provide the Time zone, Frequency and time to procced</Typography>
                    <Typography variant={"subtitle1"} color="secondary">with adding the new job.</Typography>
                </Stack>
                <Stack width="53%">
                    <JobTimeZoneModel
                        builder={builder}
                        setBuilderField={setBuilderField}
                        jobType={timeZoneType}
                    />
                </Stack>
            </Stack>
            <div style={{ width: "100%", borderBottom: "1px solid #ccc", marginTop: "50px" }} />
            <Stack direction="row" justifyContent="flex-end" sx={{ marginTop: "6%", }}>
                <StyledButtonBack
                    size="large"
                    onClick={() => 
                        navigate("/settings/jobs")
                    }
                >
                    Back
                </StyledButtonBack>
				<StyledButtonAdd
                    size="large"
                    type="submit"
                    // disabled={
					// 		!isBaseFormValid ||
					// 		!isCronExpressionValid ||
					// 		!hasChanges
				    // }
                    onClick={builder.formType === "edit" ? updateJob : addJob}
                >
                    {builder.formType === "edit" ? "Update Job" : "Add Job"}
				</StyledButtonAdd>   
            </Stack>
        </Stack>
    );
}
