import { Box } from "@mui/material";
import { useBlocks } from "../../../hooks";
import { ActionMessages, CellComponent, CellDef } from "../../../store";
import { styled, TextField, Stack } from "@semoss/ui";
import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";

const StyledStack = styled(Stack)(({ theme }) => ({
    width: "100%",
}));
const MarginTop = styled(Box)(({ theme }) => ({
    marginTop: "50px",
}));
type SendEmailFormValues = {
    smtpHost: string;
    smtpPort: string;
    subject: string;
    to: string;
    cc: string;
    bcc: string;
    from: string;
    message: string;
    username: string;
    password: string;
};
export interface SendEmailCellDef extends CellDef<"send-email"> {
    widget: "send-email";
    parameters: {
        // what you want to ask
        smtpHost: string;
        smtpPort: string;
        subject: string;
        to: string;
        cc: string;
        bcc: string;
        from: string;
        message: string;
        username: string;
        password: string;
        // variants used to create responses to compare LLMs against
    };
}
export const SendEmailCell: CellComponent<SendEmailCellDef> = observer(
    (props) => {
        const editorRef = useRef(null);

        const { cell, isExpanded } = props;
        const { state } = useBlocks();
        const { control } = useForm<SendEmailFormValues>();
        const handleChange = (newValue, path) => {
            if (cell.isLoading) {
                return;
            }

            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: path,
                    value: newValue,
                },
            });
        };
        return (
            <StyledStack>
                <Box
                    display={"flex"}
                    flexDirection={"row"}
                    alignItems={"center"}
                    gap={1}
                >
                    <Controller
                        name="smtpHost"
                        control={control}
                        defaultValue="localhost"
                        rules={{ required: "Host is required" }}
                        render={({ field }) => (
                            <TextField
                                label={"smtpHost"}
                                variant="outlined"
                                defaultValue={"localhost"}
                                fullWidth
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    field.onChange(newValue);
                                    handleChange(
                                        newValue,
                                        "parameters.smtpHost",
                                    );
                                }}
                                sx={{ margin: 0, padding: 0 }}
                            />
                        )}
                    />

                    <Controller
                        name="smtpPort"
                        control={control}
                        defaultValue="1025"
                        rules={{ required: "Port is required" }}
                        render={({ field }) => (
                            <TextField
                                label={"smtpPort"}
                                variant="outlined"
                                defaultValue={"1025"}
                                fullWidth
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    field.onChange(newValue);
                                    handleChange(
                                        newValue,
                                        "parameters.smtpPort",
                                    );
                                }}
                                sx={{ margin: 0, padding: 0 }}
                            />
                        )}
                    />
                </Box>
                <MarginTop>
                    <Box
                        display={"flex"}
                        flexDirection={"row"}
                        alignItems={"center"}
                        gap={1}
                    >
                        <Controller
                            name="username"
                            control={control}
                            defaultValue=""
                            rules={{
                                required: "Username is required",
                            }}
                            render={({ field }) => (
                                <TextField
                                    label={"username"}
                                    variant="outlined"
                                    fullWidth
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        field.onChange(newValue);
                                        handleChange(
                                            newValue,
                                            "parameters.username",
                                        );
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="password"
                            control={control}
                            defaultValue=""
                            rules={{
                                required: "Password is required",
                            }}
                            render={({ field }) => (
                                <TextField
                                    label={"password"}
                                    variant="outlined"
                                    fullWidth
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        field.onChange(newValue);
                                        handleChange(
                                            newValue,
                                            "parameters.password",
                                        );
                                    }}
                                />
                            )}
                        />
                    </Box>
                </MarginTop>
                <MarginTop>
                    <Box
                        display={"flex"}
                        flexDirection={"row"}
                        alignItems={"center"}
                        gap={1}
                    >
                        <Controller
                            name="from"
                            control={control}
                            defaultValue=""
                            rules={{
                                pattern: {
                                    value: /^S+@\S+\.\S+$/,
                                    message: "Invalid email format",
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    label={"from"}
                                    variant="outlined"
                                    fullWidth
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        field.onChange(newValue);
                                        handleChange(
                                            newValue,
                                            "parameters.from",
                                        );
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="to"
                            control={control}
                            defaultValue=""
                            rules={{
                                required: "To is required",
                                pattern: {
                                    value: /^S+@\S+\.\S+$/,
                                    message: "Invalid email format",
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    label={"to"}
                                    variant="outlined"
                                    fullWidth
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        field.onChange(newValue);
                                        handleChange(newValue, "parameters.to");
                                    }}
                                />
                            )}
                        />
                    </Box>
                </MarginTop>
                <MarginTop>
                    <Box
                        display={"flex"}
                        flexDirection={"row"}
                        alignItems={"center"}
                        gap={1}
                    >
                        <Controller
                            name="cc"
                            control={control}
                            defaultValue=""
                            rules={{
                                pattern: {
                                    value: /^S+@\S+\.\S+$/,
                                    message: "Invalid email format",
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    label={"cc"}
                                    variant="outlined"
                                    fullWidth
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        field.onChange(newValue);
                                        handleChange(newValue, "parameters.cc");
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="bcc"
                            control={control}
                            defaultValue=""
                            rules={{
                                pattern: {
                                    value: /^S+@\S+\.\S+$/,
                                    message: "Invalid email format",
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    label={"bcc"}
                                    variant="outlined"
                                    fullWidth
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        field.onChange(newValue);
                                        handleChange(
                                            newValue,
                                            "parameters.bcc",
                                        );
                                    }}
                                />
                            )}
                        />
                    </Box>
                </MarginTop>
                <MarginTop>
                    <Controller
                        name="subject"
                        control={control}
                        defaultValue=""
                        rules={{ required: "Subject is required" }}
                        render={({ field }) => (
                            <TextField
                                label={"subject"}
                                variant="outlined"
                                fullWidth
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    field.onChange(newValue);
                                    handleChange(
                                        newValue,
                                        "parameters.subject",
                                    );
                                }}
                            />
                        )}
                    />
                </MarginTop>
                <MarginTop>
                    <Controller
                        name="message"
                        control={control}
                        defaultValue=""
                        rules={{
                            required: "Message is required",
                        }}
                        render={({ field }) => (
                            <TextField
                                label={"message"}
                                variant="outlined"
                                fullWidth
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    field.onChange(newValue);
                                    handleChange(
                                        newValue,
                                        "parameters.message",
                                    );
                                }}
                                multiline
                            />
                        )}
                    />
                </MarginTop>
            </StyledStack>
        );
    },
);
