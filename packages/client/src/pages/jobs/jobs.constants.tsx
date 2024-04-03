import React, { ReactElement, ReactFragment } from "react";
import { Job } from "./jobs.types";
import { Chip, IconButton } from "@semoss/ui";
import { Delete, Edit, PlayArrow } from "@mui/icons-material";

const convertTimetoDate = (time: string) => {
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

export const JobColumns: {
    title: string; 
    field: (props: {
        job: Job;
}) => JSX.Element;
}[] = [
    {
        title: '',
        field: ({job}) => {
            return (
                <></>
            )
        }
    },
    {
        title: 'Name',
        field: ({job}) => {
            return (
                <>
                    {job.jobName}
                </>
            )
        }
    },
    {
        title: 'Type',
        field: ({job}) => {
            return (
                <>
                    {job.jobType}
                </>
            )
        }
    },
    {
        title: 'Frequency',
        field: ({job}) => {
            return <></>;
            // let freq;
            // let timeStr;
            // if (!job.customCron) {
            //     freq = job.frequency;
            //     timeStr = job.frequency.human;
        
            //     if (freq === 2) {
            //         // weekly
            //         timeStr = timeStr + ' on ' + job.dayOfWeek;
            //     }
        
            //     if (freq === 3) {
            //         // monthly
            //         timeStr = timeStr + ' on the ' + job.dayOfMonth;
            //         const monthLastDigit = job.dayOfMonth
            //                 .toString()
            //                 .substring(
            //                     job.dayOfMonth.length - 1,
            //                     job.dayOfMonth.length,
            //                 ),
            //             monthFirstDigit = job.dayOfMonth.toString().substring(0, 1);
            //         if (
            //             job.dayOfMonth.toString().length > 1 &&
            //             (monthFirstDigit === '1' || monthLastDigit === '0')
            //         )
            //             timeStr += 'th ';
            //         else if (monthLastDigit === '1') timeStr += 'st ';
            //         else if (monthLastDigit === '2') timeStr += 'nd ';
            //         else if (monthLastDigit === '3') timeStr += 'rd ';
            //         else timeStr += 'th ';
            //     }
        
            //     if (freq >= 1) {
            //         // daily
            //         timeStr = timeStr + ' at ' + job.hour + ':' + job.minute + job.ampm;
            //     }
            // } else {
            //     timeStr = 'Custom';
            // }
        
            // return timeStr;
        }
    },
    {
        title: 'Tags',
        field: ({job}) => {
            return (
                <>
                    {
                        job.jobTags &&
                        job.jobTags.split(',').map((tag, idx) => {
                            return <Chip key={idx} label={tag} avatar={null} />;
                        })
                    }
                </>
            );
        },
    },
    {
        title: 'Last Run',
        field: ({job}) => {
            let time = ''
            if (
                !(!job.PREV_FIRE_TIME ||
                job.PREV_FIRE_TIME === 'N/A' ||
                job.PREV_FIRE_TIME === 'INACTIVE')
            ) {
                time = convertTimetoDate(job.PREV_FIRE_TIME);
            }
            return (
                <>
                    {time}
                </>
            )
        }
    },
    {
        title: 'Created By',
        field: ({job}) => {
            return (
                <>
                </>
            )
        }
    },
    {
        title: 'Modified By',
        field: ({job}) => {
            return (
                <>
                    {job.USER_ID}
                </>
            )
        }
    },
    {
        title: 'Last Run By',
        field: ({job}) => {
            return (
                <>
                </>
            )
        }

    },
    {
        title: 'Modified Date',
        field: ({job}) => {
            return (
                <>
                </>
            )
        }

    },
    {
        title: '',
        field: ({job}) => {
            return (
                <>
                    <IconButton
                        color="info"
                        size="medium"
                        onClick={() => {
                            executeJob(job.jobId, job.jobGroup);
                        }}
                    >
                        <PlayArrow />
                    </IconButton>
                    <IconButton
                        color="info"
                        size="medium"
                        onClick={() => {
                            setSelectedJob(job);
                            setShowJobModal(true);
                        }}
                        disabled // enable when edit page is built out
                    >
                        <Edit />
                    </IconButton>
                    <IconButton
                        color="info"
                        size="medium"
                        onClick={() => {
                            setSelectedJob(job);
                            setShowDeleteModal(true);
                        }}
                    >
                        <Delete />
                    </IconButton>
                </>
            );
        }
    }
];