[
    {
        "id": "block--page-1",
        "data": {
            "label": "This is a block node: page-1",
            "data": {
                "slots": {
                    "content": {
                        "children": [
                            "input--3086",
                            "input--1918",
                            "input--9813"
                        ],
                        "name": "content"
                    }
                },
                "widget": "page",
                "data": {
                    "route": "",
                    "style": {
                        "padding": "24px",
                        "fontFamily": "roboto",
                        "flexDirection": "column",
                        "display": "flex",
                        "gap": "8px"
                    }
                },
                "listeners": {
                    "onPageLoad": {
                        "type": "sync",
                        "order": []
                    }
                },
                "id": "page-1"
            }
        },
        "position": {
            "x": 0,
            "y": 0
        }
    },
    {
        "id": "block--input--3086",
        "data": {
            "label": "This is a block node: input--3086",
            "data": {
                "id": "input--3086",
                "widget": "input",
                "parent": {
                    "id": "page-1",
                    "slot": "content"
                },
                "data": {
                    "style": {
                        "width": "100%",
                        "padding": "4px"
                    },
                    "value": "Hello",
                    "label": "Input 1",
                    "hint": "",
                    "type": "text",
                    "rows": 1,
                    "multiline": false,
                    "disabled": false,
                    "required": false,
                    "loading": false,
                    "show": "true"
                },
                "listeners": {
                    "preProcess": {
                        "type": "sync",
                        "order": []
                    },
                    "onChange": {
                        "type": "sync",
                        "order": [
                            {
                                "message": "RUN_CELL",
                                "payload": {
                                    "queryId": "sheet",
                                    "cellId": "5204"
                                }
                            }
                        ]
                    }
                },
                "slots": {
                    "content": {
                        "name": "content",
                        "children": []
                    }
                }
            }
        },
        "position": {
            "x": 200,
            "y": 0
        }
    },
    {
        "id": "block--input--1918",
        "data": {
            "label": "This is a block node: input--1918",
            "data": {
                "id": "input--1918",
                "widget": "input",
                "parent": {
                    "id": "page-1",
                    "slot": "content"
                },
                "data": {
                    "style": {
                        "width": "100%",
                        "padding": "4px"
                    },
                    "value": "{{sheet.1}}",
                    "label": "Input 2",
                    "hint": "",
                    "type": "text",
                    "rows": 1,
                    "multiline": false,
                    "disabled": false,
                    "required": false,
                    "loading": false,
                    "show": "true"
                },
                "listeners": {
                    "preProcess": {
                        "type": "sync",
                        "order": []
                    },
                    "onChange": {
                        "type": "sync",
                        "order": [
                            {
                                "message": "RUN_CELL",
                                "payload": {
                                    "queryId": "sheet",
                                    "cellId": "57114"
                                }
                            }
                        ]
                    }
                },
                "slots": {
                    "content": {
                        "name": "content",
                        "children": []
                    }
                }
            }
        },
        "position": {
            "x": 400,
            "y": 0
        }
    },
    {
        "id": "block--input--9813",
        "data": {
            "label": "This is a block node: input--9813",
            "data": {
                "id": "input--9813",
                "widget": "input",
                "parent": {
                    "id": "page-1",
                    "slot": "content"
                },
                "data": {
                    "style": {
                        "width": "100%",
                        "padding": "4px"
                    },
                    "value": "{{sheet.2}}",
                    "label": "Input 3",
                    "hint": "",
                    "type": "text",
                    "rows": 1,
                    "multiline": false,
                    "disabled": false,
                    "required": false,
                    "loading": false,
                    "show": "true"
                },
                "listeners": {
                    "preProcess": {
                        "type": "sync",
                        "order": []
                    },
                    "onChange": {
                        "type": "sync",
                        "order": []
                    }
                },
                "slots": {
                    "content": {
                        "name": "content",
                        "children": []
                    }
                }
            }
        },
        "position": {
            "x": 600,
            "y": 0
        }
    },
    {
        "id": "variable--input--3086",
        "data": {
            "label": "This is a variable node: input--3086",
            "data": {
                "type": "block",
                "to": "input--3086",
                "isInput": true
            }
        },
        "position": {
            "x": 0,
            "y": 150
        }
    },
    {
        "id": "variable--input--1918",
        "data": {
            "label": "This is a variable node: input--1918",
            "data": {
                "type": "block",
                "to": "input--1918",
                "isInput": true
            }
        },
        "position": {
            "x": 200,
            "y": 150
        }
    },
    {
        "id": "variable--input--9813",
        "data": {
            "label": "This is a variable node: input--9813",
            "data": {
                "type": "block",
                "to": "input--9813",
                "isInput": true
            }
        },
        "position": {
            "x": 400,
            "y": 150
        }
    },
    {
        "id": "variable--sheet",
        "data": {
            "label": "This is a variable node: sheet",
            "data": {
                "type": "query",
                "to": "sheet",
                "isOutput": true
            }
        },
        "position": {
            "x": 600,
            "y": 150
        }
    },
    {
        "id": "variable--sheet--5204",
        "data": {
            "label": "This is a variable node: sheet--5204",
            "data": {
                "type": "cell",
                "to": "sheet",
                "cellId": "5204"
            }
        },
        "position": {
            "x": 800,
            "y": 150
        }
    },
    {
        "id": "variable--sheet--57114",
        "data": {
            "label": "This is a variable node: sheet--57114",
            "data": {
                "type": "cell",
                "to": "sheet",
                "cellId": "57114"
            }
        },
        "position": {
            "x": 1000,
            "y": 150
        }
    },
    {
        "id": "notebook--sheet--cell--5204",
        "data": {
            "label": "This is a cell node: 5204",
            "data": {
                "id": "5204",
                "widget": "code",
                "parameters": {
                    "code": "\"{{input--3086}}\"+  \" \" + \"Monkey Boy\"",
                    "type": "py"
                }
            }
        },
        "position": {
            "x": 0,
            "y": 450
        }
    },
    {
        "id": "notebook--sheet--cell--57114",
        "data": {
            "label": "This is a cell node: 57114",
            "data": {
                "id": "57114",
                "widget": "code",
                "parameters": {
                    "type": "py",
                    "code": "\"{{input--1918}}\" + \" \" + \"Donkey Boy\""
                }
            }
        },
        "position": {
            "x": 0,
            "y": 600
        }
    },
    {
        "id": "notebook--sheet",
        "data": {
            "label": "This is a notebook node: sheet",
            "data": {
                "id": "sheet",
                "cells": [
                    {
                        "id": "5204",
                        "widget": "code",
                        "parameters": {
                            "code": "\"{{input--3086}}\"+  \" \" + \"Monkey Boy\"",
                            "type": "py"
                        }
                    },
                    {
                        "id": "57114",
                        "widget": "code",
                        "parameters": {
                            "type": "py",
                            "code": "\"{{input--1918}}\" + \" \" + \"Donkey Boy\""
                        }
                    }
                ]
            }
        },
        "position": {
            "x": 0,
            "y": 300
        }
    }
]