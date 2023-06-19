module.exports = {
    name: 'Export PDF',
    description: 'Export HTML inputs to a PDF file',
    icon: require('images/pdf.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                query: 'ToPdf(html=["<htmlToPdf>"], outputFilePath=[""], url=["<url>"], mustache=[<mustacheTemplate>], mustacheVars=[<mustacheVars>], fileName=["<exportFileName>"], pdfSignatureBlock=[<signatureBlock>], pdfSignatureLabel=["<signatureLabel>"], pdfPageNumbers=[<pageNumbers>], pdfPageNumbersIgnoreFirst=[<ignoreFirstPage>], pdfStartPageNumbers=[<pageNumberStart>]);',
                label: 'Convert HTML to PDF',
                description: 'Create a PDF file by converting HTML inputs.',
                params: [
                    {
                        paramName: 'mustacheTemplate',
                        view: {
                            displayType: 'dropdown',
                            label: 'Use mustache template format:',
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
                            defaultValue: 'true',
                        },
                        required: true,
                    },
                    {
                        paramName: 'mustacheVars',
                        view: {
                            displayType: 'text-area',
                            label: 'Enter map variables for mustache:',
                            description: 'Note: Must be a map object',
                        },
                        required: false,
                    },
                    {
                        paramName: 'htmlToPdf',
                        view: {
                            displayType: 'text-area',
                            label: 'Enter HTML view of the PDF:',
                        },
                        required: true,
                    },
                    {
                        paramName: 'signatureBlock',
                        view: {
                            displayType: 'dropdown',
                            label: 'Add digital signature block in PDF:',
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
                        paramName: 'signatureLabel',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter a signature label for the signature block:',
                        },
                        required: false,
                    },
                    {
                        paramName: 'pageNumbers',
                        view: {
                            displayType: 'dropdown',
                            label: 'Add page numbers to the PDF:',
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
                            defaultValue: 'true',
                        },
                        required: true,
                    },
                    {
                        paramName: 'ignoreFirstPage',
                        view: {
                            displayType: 'dropdown',
                            label: 'Ignore page numbers on first page:',
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
                        paramName: 'pageNumberStart',
                        view: {
                            displayType: 'number',
                            label: 'Enter the starting number for the page counts:',
                        },
                        model: {
                            defaultValue: 1,
                        },
                    },
                    {
                        paramName: 'url',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter the SEMOSS URL for embeeded insight screenshots:',
                        },
                        required: false,
                    },
                    {
                        paramName: 'exportFileName',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter name of pdf file:',
                        },
                        required: true,
                    },
                    // {
                    //     paramName: 'outputFileLocation',
                    //     view: {
                    //         displayType: 'freetext',
                    //         label: 'Enter output pdf file location:',
                    //     },
                    // 	required: false,
                    // },
                ],
                execute: 'button',
            },
        ],
    },
};
