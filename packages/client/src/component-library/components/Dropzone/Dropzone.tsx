import React, { useRef } from 'react';
import {
    useDropzone,
    DropzoneOptions as MuiDropzoneOptions,
} from 'react-dropzone';
import { styled, SxProps } from '@mui/material';
import { FileUploadOutlined } from '@mui/icons-material';
import { Avatar } from '../Avatar';
import { Container } from '../Container';
import { IconButton } from '../IconButton';
import { TextField } from '../TextField';
import { Typography } from '../Typography';

const StyledLink = styled('button')(({ theme }) => ({
    display: 'inline-block',
    color: theme.palette.primary.main,
    cursor: 'pointer',
}));

export interface DropzoneAreaProps extends MuiDropzoneOptions {
    /** custom style object */
    sx?: SxProps;
}

interface GetInputPropsOptionsRef {
    ref?: React.RefObject<HTMLInputElement>;
}

export function DropzoneArea() {
    const { getRootProps, getInputProps } = useDropzone({
        noClick: true,
    });

    const fileInput = useRef<HTMLInputElement>();

    return (
        <Container
            maxWidth="lg"
            sx={{
                backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23333' stroke-width='1' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
                borderRadius: '16px',
                borderColor: 'rgba(0,0,0,0.23)',
            }}
        >
            <div
                style={{ paddingTop: '36px', paddingBottom: '36px' }}
                {...getRootProps({ className: 'dropzone' })}
            >
                <input {...(getInputProps() as GetInputPropsOptionsRef)} />

                <label>
                    <TextField
                        variant="outlined"
                        type="text"
                        sx={{ display: 'none' }}
                        InputProps={{
                            endAdornment: (
                                <IconButton>
                                    <FileUploadOutlined />
                                    <input
                                        ref={fileInput}
                                        style={{ display: 'none' }}
                                        type="file"
                                        hidden
                                        name="[licenseFile]"
                                    />
                                </IconButton>
                            ),
                        }}
                    />
                    <Typography
                        variant="body1"
                        sx={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <Avatar
                            sx={{ bgcolor: '#E1F5FE', marginRight: '16px' }}
                        >
                            <FileUploadOutlined sx={{ color: '#40a0ff' }} />
                        </Avatar>
                        <span>
                            {
                                <StyledLink
                                    onClick={() => fileInput.current.click()}
                                >
                                    Click to Upload
                                </StyledLink>
                            }
                            &nbsp;or drag and drop
                            <Typography variant="subtitle2">
                                Maximum File size 100MB.
                            </Typography>
                        </span>
                    </Typography>
                </label>
            </div>
        </Container>
    );
}
