'use strict';

const _attrs = {
    'text-align': {
        default: null,
    },
    'line-height': {
        default: null,
    },
    'letter-spacing': {
        default: null,
    },
};

/**
 * @name parseAttrs
 * @param dom the dom element
 * @desc grab all the attrs from the dom and pass it back
 */
function _parseAttrs(dom) {
    const attrs = {};
    if (dom.style['text-align']) {
        attrs['text-align'] = dom.style['text-align'];
    }

    if (dom.style['line-height']) {
        attrs['line-height'] = dom.style['line-height'];
    }

    if (dom.style['letter-spacing']) {
        attrs['letter-spacing'] = dom.style['letter-spacing'];
    }

    return attrs;
}

/**
 * @toAttrs
 * @param node the node to append styles to
 * @param returnObj the object to modify
 * @desc append these styls to the node
 */
function _toAttrs(node, returnObj): string {
    let style = '';

    if (node.attrs['text-align']) {
        style += 'text-align: ' + node.attrs['text-align'] + ';';
    }

    if (node.attrs['line-height']) {
        style += 'line-height: ' + node.attrs['line-height'] + ';';
    }

    if (node.attrs['letter-spacing']) {
        style += 'letter-spacing: ' + node.attrs['letter-spacing'] + ';';
    }

    if (style) {
        returnObj.push({
            style: style,
        });
    }

    return returnObj;
}

// :: Object
// [Specs](#model.NodeSpec) for the nodes defined in this schema.
export const nodes = {
    // :: NodeSpec The top level document node.
    doc: {
        content: 'block+', // restrictions to be placed in the editor via regex. {1} only one of this block; heading - only heading block allowed
    },
    // :: NodeSpec A plain paragraph textblock. Represented in the DOM
    // as a `<p>` element.
    paragraph: {
        attrs: _attrs,
        content: 'inline*',
        group: 'block',
        parseDOM: [
            {
                tag: 'p',
                getAttrs(dom) {
                    let attrs = {};
                    if (dom.getAttribute('style')) {
                        attrs = _parseAttrs(dom);
                    }

                    return Object.keys(attrs).length > 0 ? attrs : false;
                },
            },
        ],
        toDOM(node) {
            let returnObj: any = ['p'];

            returnObj = _toAttrs(node, returnObj);

            returnObj.push(0);
            return returnObj;
        },
    },

    // :: NodeSpec A blockquote (`<blockquote>`) wrapping one or more blocks.
    blockquote: {
        content: 'block+',
        group: 'block',
        defining: true,
        parseDOM: [{ tag: 'blockquote' }],
        toDOM() {
            return ['blockquote', 0];
        },
    },

    // :: NodeSpec A horizontal rule (`<hr>`).
    horizontal_rule: {
        group: 'block',
        parseDOM: [{ tag: 'hr' }],
        toDOM() {
            return ['hr'];
        },
    },

    // :: NodeSpec A heading textblock
    // Parsed and serialized as `<h1>`
    heading_title: {
        attrs: _attrs,
        content: 'inline*',
        group: 'block',
        defining: true,
        parseDOM: [
            {
                tag: 'h1',
                getAttrs(dom) {
                    let attrs = {};
                    if (dom.getAttribute('style')) {
                        attrs = _parseAttrs(dom);
                    }

                    return Object.keys(attrs).length > 0 ? attrs : false;
                },
            },
        ],
        toDOM(node) {
            let returnObj: any = ['h1'];

            returnObj = _toAttrs(node, returnObj);

            returnObj.push(0);
            return returnObj;
        },
    },

    // :: NodeSpec A heading textblock, with a `level` attribute that
    // Parsed and serialized as `<h2>`
    heading_sub: {
        attrs: _attrs,
        content: 'inline*',
        group: 'block',
        defining: true,
        parseDOM: [
            {
                tag: 'h2',
                getAttrs(dom) {
                    let attrs = {};
                    if (dom.getAttribute('style')) {
                        attrs = _parseAttrs(dom);
                    }

                    return Object.keys(attrs).length > 0 ? attrs : false;
                },
            },
        ],
        toDOM(node) {
            let returnObj: any = ['h2'];

            returnObj = _toAttrs(node, returnObj);

            returnObj.push(0);
            return returnObj;
        },
    },

    // :: NodeSpec A code listing. Disallows marks or non-text inline
    // nodes by default. Represented as a `<pre>` element with a
    // `<code>` element inside of it.
    code_block: {
        content: 'text*',
        marks: '',
        group: 'block',
        code: true,
        defining: true,
        parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
        toDOM() {
            return ['pre', ['code', 0]];
        },
    },

    // :: NodeSpec The text node.
    text: {
        group: 'inline',
    },

    // :: NodeSpec An inline image (`<img>`) node. Supports `src`,
    // `alt`, and `href` attributes. The latter two default to the empty
    // string.
    image: {
        inline: true,
        attrs: {
            src: {},
            alt: { default: null },
            title: { default: null },
        },
        group: 'inline',
        draggable: true,
        parseDOM: [
            {
                tag: 'img[src]',
                getAttrs(dom) {
                    return {
                        src: dom.getAttribute('src'),
                        title: dom.getAttribute('title'),
                        alt: dom.getAttribute('alt'),
                    };
                },
            },
        ],
        toDOM(node) {
            const { src, alt, title } = node.attrs;
            return ['img', { src, alt, title }];
        },
    },

    // :: NodeSpec A hard line break, represented in the DOM as `<br>`.
    hard_break: {
        inline: true,
        group: 'inline',
        selectable: false,
        parseDOM: [{ tag: 'br' }],
        toDOM() {
            return ['br'];
        },
    },
};

const emDOM = ['em', 0],
    strongDOM = ['strong', 0],
    codeDOM = ['code', 0];

// :: Object [Specs](#model.MarkSpec) for the marks in the schema.
export const marks = {
    // :: MarkSpec A link. Has `href` and `title` attributes. `title`
    // defaults to the empty string. Rendered and parsed as an `<a>`
    // element.
    link: {
        attrs: {
            href: {},
            title: { default: null },
            target: { default: '_blank' },
        },
        inclusive: true,
        parseDOM: [
            {
                tag: 'a[href]',
                getAttrs(dom) {
                    return {
                        href: dom.getAttribute('href'),
                        title: dom.getAttribute('title'),
                        target: dom.getAttribute('target'),
                    };
                },
            },
        ],
        toDOM(node) {
            const { href, title, target } = node.attrs;
            return ['a', { href, title, target }, 0];
        },
    },

    // :: MarkSpec An emphasis mark. Rendered as an `<em>` element.
    // Has parse rules that also match `<i>` and `font-style: italic`.
    em: {
        parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
        toDOM() {
            return emDOM;
        },
    },

    // :: MarkSpec A strong mark. Rendered as `<strong>`, parse rules
    // also match `<b>` and `font-weight: bold`.
    strong: {
        parseDOM: [
            {
                tag: 'strong',
            },
            // This works around a Google Docs misbehavior where
            // pasted content will be inexplicably wrapped in `<b>`
            // tags with a font-weight normal.
            {
                tag: 'b',
                getAttrs: (node) => node.style.fontWeight != 'normal' && null,
            },
            {
                style: 'font-weight',
                getAttrs: (value) =>
                    /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
            },
        ],
        toDOM() {
            return strongDOM;
        },
    },

    // :: MarkSpec Code font mark. Represented as a `<code>` element.
    code: {
        parseDOM: [{ tag: 'code' }],
        toDOM() {
            return codeDOM;
        },
    },

    // :: MarkSpec A colored mark. Rendered as `<span>`, parse rules
    color: {
        attrs: {
            color: {},
        },
        inclusive: true,
        parseDOM: [
            {
                tag: 'span',
                getAttrs(dom) {
                    if (dom.getAttribute('style') && dom.style.color) {
                        return {
                            color: dom.style.color,
                        };
                    }

                    return false;
                },
            },
        ],
        toDOM(node) {
            const returnObj: any = ['span'];

            if (node.attrs.color) {
                returnObj.push({
                    style: `color: ${node.attrs.color};`,
                });
            }

            returnObj.push(0);
            return returnObj;
        },
    },

    'font-size': {
        attrs: {
            'font-size': {},
        },
        inclusive: true,
        parseDOM: [
            {
                tag: 'span',
                getAttrs(dom) {
                    if (dom.getAttribute('style') && dom.style['font-size']) {
                        return {
                            'font-size': dom.style['font-size'],
                        };
                    }

                    return false;
                },
            },
        ],
        toDOM(node) {
            const returnObj: any = ['span'];

            if (node.attrs['font-size']) {
                returnObj.push({
                    style: `font-size: ${node.attrs['font-size']};`,
                });
            }

            returnObj.push(0);
            return returnObj;
        },
    },

    'font-family': {
        attrs: {
            'font-family': {},
        },
        inclusive: true,
        parseDOM: [
            {
                tag: 'span',
                getAttrs(dom) {
                    if (dom.getAttribute('style') && dom.style['font-family']) {
                        return {
                            'font-family': dom.style['font-family'],
                        };
                    }

                    return false;
                },
            },
        ],
        toDOM(node) {
            const returnObj: any = ['span'];

            if (node.attrs['font-family']) {
                returnObj.push({
                    style: `font-family: ${node.attrs['font-family']};`,
                });
            }

            returnObj.push(0);
            return returnObj;
        },
    },

    'text-decoration': {
        attrs: {
            'text-decoration': {},
        },
        inclusive: true,
        parseDOM: [
            {
                tag: 'span',
                getAttrs(dom) {
                    if (
                        dom.getAttribute('style') &&
                        dom.style['text-decoration']
                    ) {
                        return {
                            'text-decoration': dom.style['text-decoration'],
                        };
                    }

                    return false;
                },
            },
        ],
        toDOM(node) {
            const returnObj: any = ['span'];

            if (node.attrs['text-decoration']) {
                returnObj.push({
                    style: `text-decoration: ${node.attrs['text-decoration']};`,
                });
            }

            returnObj.push(0);
            return returnObj;
        },
    },
};

// :: Schema
// This schema roughly corresponds to the document schema used by
// [CommonMark](http://commonmark.org/), minus the list elements,
// which are defined in the [`prosemirror-schema-list`](#schema-list)
// module.
//
// To reuse elements from this schema, extend or read from its
// `spec.nodes` and `spec.marks` [properties](#model.Schema.spec).
// export const schema = new Schema({nodes, marks})
