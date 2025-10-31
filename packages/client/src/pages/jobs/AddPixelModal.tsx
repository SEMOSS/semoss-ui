import { useState } from "react";
import { Box, Modal, Stack, TextField, Typography, styled, Button } from "@semoss/ui";

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

export const AddPixelModal = (props: {
    isOpen: boolean;
    setPixelOpen: (open: boolean) => void;
    builder: any;
    setBuilderField: (field: string, value: string | string[]) => void;
}) => {
    const { isOpen, builder, setBuilderField, setPixelOpen } = props;
    const [pixel, setPixel] = useState(builder.pixel);
    return (
        <Modal
            open={isOpen}
            onClose={() => setPixelOpen(false)}
            maxWidth="md"
            fullWidth
        >
            <Stack padding={5} height="825px">
                <Typography variant={"h6"}>Pixel</Typography>
                <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <TextField
                        sx={{ 
                            width: "100%", 
                            height: "100%",
                            "& .MuiInputBase-root": {
                                height: "100%"
                            },
                            "& .MuiInputBase-input": {
                                height: "100% !important",
                                overflow: "auto"
                            }
                        }}
                        variant="outlined"
                        multiline
                        value={pixel}
                        onChange={(e) => setPixel(e.target.value)}
                    />
                </Box>
                <Stack direction="row" justifyContent="flex-end" sx={{ marginTop: "16%", }}>
                    <StyledButtonBack
                        size="large"
                        onClick={() => 
                            setPixelOpen(false)
                        }
                    >
                        Back
                    </StyledButtonBack>
                    <StyledButtonAdd
                        size="large"
                        type="submit"
                        onClick={() => {
                            setBuilderField("pixel", pixel);
                            setPixelOpen(false);
                        }}
                    >
                        Done
                    </StyledButtonAdd>   
                </Stack>
            </Stack>
        </Modal>
    )
}