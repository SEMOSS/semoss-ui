import ace from 'ace-builds';
import 'ace-builds/src-min-noconflict/ext-language_tools.js';

import { OPERATIONS } from '../../../core/constants';

ace.define(
    'ace/mode/formula_highlight_rules',
    [
        'require',
        'exports',
        'module',
        'ace/lib/oop',
        'ace/lib/lang',
        'ace/mode/doc_comment_highlight_rules',
        'ace/mode/text_highlight_rules',
    ],
    function (acequire, exports, module) {
        let oop = acequire('../lib/oop'),
            lang = acequire('../lib/lang'),
            DocCommentHighlightRules = acequire(
                './doc_comment_highlight_rules'
            ).DocCommentHighlightRules,
            TextHighlightRules = acequire(
                './text_highlight_rules'
            ).TextHighlightRules,
            FormulaHighlightRules = function () {
                let functions = OPERATIONS,
                    builtins = '',
                    keywordMapper;

                // Adding the functions from the constants
                for (let index = 0; index < functions.length; index++) {
                    builtins =
                        builtins +
                        '|' +
                        functions[index].function +
                        ' ( ColumnName )';
                }
                keywordMapper = this.createKeywordMapper(
                    {
                        'support.function': builtins,
                    },
                    'identifier',
                    true
                );

                function string(rule) {
                    let start = rule.start,
                        escapeSeq = rule.escape;
                    return {
                        token: 'string.start',
                        regex: start,
                        next: [
                            {
                                token: 'constant.language.escape',
                                regex: escapeSeq,
                            },
                            {
                                token: 'string.end',
                                next: 'start',
                                regex: start,
                            },
                            { defaultToken: 'string' },
                        ],
                    };
                }

                this.$rules = {
                    start: [
                        {
                            token: 'comment',
                            regex: '(?:-- |#).*$',
                        },
                        string({ start: '"', escape: /\\[0'"bnrtZ\\%_]?/ }),
                        string({ start: "'", escape: /\\[0'"bnrtZ\\%_]?/ }),
                        DocCommentHighlightRules.getStartRule('doc-start'),
                        {
                            token: 'comment', // multi line comment
                            regex: /\/\*/,
                            next: 'comment',
                        },
                        {
                            token: 'constant.numeric', // hex
                            regex: /0[xX][0-9a-fA-F]+|[xX]'[0-9a-fA-F]+'|0[bB][01]+|[bB]'[01]+'/,
                        },
                        {
                            token: 'constant.numeric', // float
                            regex: '[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b',
                        },
                        {
                            token: keywordMapper,
                            regex: '[a-zA-Z_$][a-zA-Z0-9_$]*\\b',
                        },
                        {
                            token: 'constant.class',
                            regex: '@@?[a-zA-Z_$][a-zA-Z0-9_$]*\\b',
                        },
                        {
                            token: 'constant.buildin',
                            regex: '`[^`]*`',
                        },
                        {
                            token: 'keyword.operator',
                            regex: '\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|=',
                        },
                        {
                            token: 'paren.lparen',
                            regex: '[\\(]',
                        },
                        {
                            token: 'paren.rparen',
                            regex: '[\\)]',
                        },
                        {
                            token: 'text',
                            regex: '\\s+',
                        },
                    ],
                    comment: [
                        { token: 'comment', regex: '\\*\\/', next: 'start' },
                        { defaultToken: 'comment' },
                    ],
                };

                this.embedRules(DocCommentHighlightRules, 'doc-', [
                    DocCommentHighlightRules.getEndRule('start'),
                ]);
                this.normalizeRules();
            };

        oop.inherits(FormulaHighlightRules, TextHighlightRules);

        exports.FormulaHighlightRules = FormulaHighlightRules;
    }
);

ace.define(
    'ace/mode/formula',
    [
        'require',
        'exports',
        'module',
        'ace/lib/oop',
        'ace/mode/text',
        'ace/mode/formula_highlight_rules',
    ],
    function (acequire, exports, module) {
        let oop = acequire('../lib/oop'),
            TextMode = acequire('../mode/text').Mode,
            FormulaHighlightRules = acequire(
                './formula_highlight_rules'
            ).FormulaHighlightRules,
            Mode = function () {
                this.HighlightRules = FormulaHighlightRules;
                this.$behaviour = this.$defaultBehaviour;
            };
        oop.inherits(Mode, TextMode);

        (function () {
            this.lineCommentStart = ['--', '#']; // todo space
            this.blockComment = { start: '/*', end: '*/' };

            this.$id = 'ace/mode/formula';
        }.call(Mode.prototype));

        exports.Mode = Mode;
    }
);
