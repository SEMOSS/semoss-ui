import { CellConfig } from "../../../store";
import { SendEmailCell, SendEmailCellDef } from "./SendEmailCell";

export const SendEmailCellConfig: CellConfig<SendEmailCellDef> = {
    name: "SendEmail",
    widget: "send-email",
    view: SendEmailCell,
    parameters: {
        smtpHost: "localhost",
        smtpPort: "1025",
        subject: "",
        to: "",
        cc: "",
        bcc: "",
        from: "",
        message: "",
        username: "",
        password: "",
    },
    toPixel: ({
        smtpHost,
        smtpPort,
        subject,
        to,
        cc,
        bcc,
        from,
        message,
        username,
        password,
    }) => {
        return `SendEmail(smtpHost="${smtpHost}", smtpPort="${smtpPort}", subject="${subject}", to="${to}", cc="${cc}", bcc="${bcc}", from="${from}", message="${message}", username="${username}", password="${password}")`;
    },
};
