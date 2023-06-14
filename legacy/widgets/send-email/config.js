module.exports = {
    name: 'Send Email',
    description: 'Creates an Email with a SMTP inputs ',
    icon: require('images/email.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                query: 'SendEmail(smtpHost=["<smtpHost>"], smtpPort=["<smtpPort>"], subject=["<emailSubject>"], from=["<emailSender>"], html=["<emailHTML>"], message=["<encode><emailMessage></encode>"], messageEncoded=[true], mustache=["<mustacheTemplate>"], varMap=["<varMap>"], username=["<username>"], password=["<password>"], to=["<emailReceiver>"], cc=["<emailCCReciever>"], bcc=["<emailBCCReciever>"], attachments=[""]);',
                label: 'Send Email',
                description: 'Send Email',
                params: [
                    {
                        paramName: 'smtpHost',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter SMTP Host Address:',
                            description: 'Note: Enter SMTP HOST.',
                        },
                        required: false,
                    },
                    {
                        paramName: 'smtpPort',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter Port Address:',
                            description: 'Note: Eneter SMTP PORT.',
                        },
                        required: false,
                    },
                    {
                        paramName: 'emailSender',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter Email Address of Sender:',
                            description: 'Note: Enter Sender of Email.',
                        },
                        required: false,
                    },
                    {
                        paramName: 'emailSubject',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter Subject for the Email:',
                            description: 'Note: Enter Subject for the Email.',
                        },
                        required: true,
                    },
                    {
                        paramName: 'emailHTML',
                        view: {
                            displayType: 'dropdown',
                            label: 'Is Email In HTML format:',
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultOptions: [
                                {
                                    value: 'true',
                                    display: 'Yes',
                                },
                                {
                                    value: 'false',
                                    display: 'No',
                                },
                            ],
                            defaultValue: 'false',
                        },
                        required: false,
                    },
                    {
                        paramName: 'emailMessage',
                        view: {
                            displayType: 'text-area',
                            label: 'Enter Message Body of Email:',
                            description: 'Note: Enter Message for Email.',
                        },
                        required: false,
                    },
                    {
                        paramName: 'mustacheTemplate',
                        view: {
                            displayType: 'dropdown',
                            label: 'Use Mustache Template Format:',
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultOptions: [
                                {
                                    value: 'true',
                                    display: 'Yes',
                                },
                                {
                                    value: 'false',
                                    display: 'No',
                                },
                            ],
                            defaultValue: 'false',
                        },
                        required: true,
                    },
                    {
                        paramName: 'varMap',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter Map Variables for Mustache',
                            description:
                                'Note: If you selected to use Mustache, please enter VarMap',
                        },
                        required: false,
                    },
                    {
                        paramName: 'username',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter Username:',
                            description: 'Note: Enter Username',
                        },
                        required: false,
                    },
                    {
                        paramName: 'password',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter Password:',
                            description: 'Note: Enter Password',
                        },
                        required: false,
                    },
                    {
                        paramName: 'emailReceiver',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter Receiver of Email:',
                            description: 'Note: Enter Receiver for email',
                        },
                        required: false,
                    },
                    {
                        paramName: 'emailCCReciever',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter CC Receivers of this email:',
                            description: 'Note: Enter CC Receivers for email',
                        },
                        required: false,
                    },
                    {
                        paramName: 'emailBCCReciever',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter BCC Receivers of email:',
                            description: 'Note: Enter BCC Receiver for email',
                        },
                        required: false,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
