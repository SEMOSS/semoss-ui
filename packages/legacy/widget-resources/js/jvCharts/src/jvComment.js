import * as d3 from 'd3';
import commentTemplates from './commentTemplates.js';

/** *  jvComment ***/
'use-strict';
/**
* @name jvComment
* @desc Constructor for JV Comment - creates comments for a jv visualization and executes a callback for the comments to be saved
* @param {object} configObj - constructor object containing the jvChart and other options
*/
export default class jvComment {
    constructor(configObj) {
        this.chartDiv = configObj.chartDiv;
        this.showComments = false;
        this.onSaveCallback = configObj.onSaveCallback;
        this.getMode = configObj.getMode;
        this.comments = jvComment.setCommentsList(configObj.comments);
        this.drawCommentNodes();
        return this;
    }

    /**
    * @name createMoveListener
    * @desc creates the mousemove listener to determine if the user moves or resizes a comment
    * @param {object} commentNode - comment that the user clicked on
    * @return {undefined} - no return
    */
    createMoveListener(commentNode) {
        var commentObj = this,
            timeMouseDown = new Date().getTime();
        commentObj.moved = null;
        commentObj.chartDiv.on('mousemove', function () {
            // mouse move happend too quickly, chrome bug
            var timeMouseMove = new Date().getTime(),
                node = commentNode.node(),
                mouseOnComment = d3.mouse(commentNode.node()),
                mouseOnChartDiv = d3.mouse(commentObj.chartDiv.node()),
                resizeNode;
            if (timeMouseDown + 10 > timeMouseMove) {
                return;
            }
            // set the moved node, so we know to do a mouse up event
            commentObj.moved = commentNode;

            // resize in the right corner of the comment
            if (commentNode.select('.comment-padding')._groups[0][0] && ((mouseOnComment[0] + 15 > node.clientWidth && mouseOnComment[1] + 15 > node.clientHeight) || commentObj.moved.mouse)) {
                if (!commentObj.moved.mouse) {
                    resizeNode = commentNode.select('.comment-padding');
                    resizeNode.style('width', 'auto');
                    resizeNode.style('height', 'auto');
                }
                // set the mouse event so we can update the location on mouse up
                commentObj.moved.mouse = mouseOnChartDiv;
            } else {
                // move the comment node around the visual
                if (commentNode._groups[0][0].nodeName === 'text') {
                    commentObj.chartDiv.select('.commentbox-readonly').remove();
                }
                commentNode
                    .style('left', mouseOnChartDiv[0] + 'px')
                    .style('top', mouseOnChartDiv[1] + 'px');
                commentNode
                    .attr('x', mouseOnChartDiv[0])
                    .attr('y', mouseOnChartDiv[1]);
            }
        });
    }

    /**
    * @name updatePosition
    * @desc determines whether the user dragged a comment on the screen or updated its size and then creates the appropriate save function
    * @return {undefined} - no return
    */
    updatePosition() {
        let commentObj = this,
            nodeToUpdate = commentObj.moved._groups[0][0],
            nodeId = nodeToUpdate.id.split('node')[1],
            comment = commentObj.comments.list[nodeId],
            x,
            y;
        if (Array.isArray(commentObj.moved.mouse)) {
            comment.binding.width = commentObj.moved._groups[0][0].clientWidth;
            comment.binding.height = commentObj.moved._groups[0][0].clientHeight;
        } else {
            x = Math.round(nodeToUpdate.getAttribute('x'));
            y = Math.round(nodeToUpdate.getAttribute('y'));
            comment.binding = {
                'x': x,
                'y': y,
                'clientWidth': commentObj.chartDiv._groups[0][0].clientWidth,
                'clientHeight': commentObj.chartDiv._groups[0][0].clientHeight,
                'showAsMarker': comment.binding.showAsMarker,
                'height': comment.binding.height,
                'width': comment.binding.width
            };
        }

        commentObj.onSaveCallback(comment, nodeId, 'edit');
    }

    /**
    * @name makeComment
    * @desc creates the comment entry box on the screen and attaches listeners to the save delete and cancel options
    * @param {object} event - event that holds the mouse position for where the user wants to place the comment
    * @return {undefined} - no return
    */
    makeComment() {
        if (this.chartDiv.select('.commentbox')._groups[0][0] || this.chartDiv.select('.commentbox-edit')._groups[0][0]) {
            // dont create new comment
            return;
        }

        let commentObj = this,
            x = parseInt(d3.mouse(this.chartDiv.node())[0], 10),
            y = parseInt(d3.mouse(this.chartDiv.node())[1], 10),
            commentHeight = 145,
            commentWidth = 200,
            // calculate position of overlay div
            position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y),
            commentType = 'svgMain',
            commentDiv,
            // What is the visual type we are saving this comment for?
            vizType = commentObj.chartDiv._groups[0][0].parentElement.nodeName.split('-')[0];


        commentObj.chartDiv.selectAll('.commentbox-readonly').remove();
        commentObj.showComments = false;
        commentDiv = commentObj.chartDiv.append('div')
            .attr('class', 'commentbox')
            .attr('id', 'commentbox')
            .style('opacity', 1)
            .html(commentTemplates.create)
            .style('position', 'absolute')
            .style('left', position.x + 'px')
            .style('top', position.y + 'px');

        // Autofocus on the text area
        commentDiv
            .select('.comment-textarea')
            .node().focus();

        commentDiv
            .select('#cancel')
            .on('click.delete', commentObj.removeComment.bind(commentObj));

        commentDiv
            .select('#submit')
            .on('click.save', () => {
                let commentText = commentDiv.select('#textarea1')._groups[0][0].value,
                    showAsMarker = commentDiv.select('#display')._groups[0][0].checked,
                    alwaysDisplay = commentDiv.select('#global')._groups[0][0].checked,
                    newCommentObj;

                newCommentObj = {
                    'commentText': commentText,
                    'type': commentType,
                    'binding': {
                        'x': x, // location x
                        'y': y, // location y
                        'clientWidth': commentObj.chartDiv._groups[0][0].clientWidth, // width of chart container
                        'clientHeight': commentObj.chartDiv._groups[0][0].clientHeight, // height of chart container
                        'showAsMarker': showAsMarker ? 'true' : 'false',
                        'height': false, // width of comment
                        'width': false // height of comment
                    },
                    'vizType': vizType,
                    'display': true,
                    'alwaysDisplay': alwaysDisplay
                };
                commentDiv.remove();
                if (isNaN(commentObj.comments.maxId)) {
                    commentObj.comments.maxId = -1;
                }
                commentObj.onSaveCallback(newCommentObj, ++commentObj.comments.maxId, 'add');
            });
    }

    /**
    * @name removeComment
    * @desc function to remove comment entry box
    * @return {undefined} - no return
    */
    removeComment() {
        this.chartDiv.selectAll('.commentbox').remove();
    }

    /**
    * @name drawCommentNodes
    * @desc function to draw a all comments on the visual
    * @return {undefined} - no return
    */
    drawCommentNodes() {
        this.chartDiv.selectAll('.min-comment').remove();
        Object.entries(this.comments.list).map(([id, comment]) => this.drawComment(comment, id));
    }

    /**
    * @name drawComment
    * @desc function to draw a single comment on the visual
    * @param {object} comment - data used to pain the comment
    * @param {number} id - id of the specific comment
    * @return {undefined} - no return
    */
    drawComment(comment, id) {
        if (typeof this.chartDiv._groups === 'undefined') {
            console.log('Comment data is in old format, will not display or chart div doesnt exist');
            return;
        }

        if (!comment.binding || !this.chartDiv._groups[0][0]) {
            console.log('Comment data is in old format, will not display or chart div doesnt exist');
            return;
        }

        if (comment.display === false && comment.alwaysDisplay !== true) {
            return;
        }

        let commentObj = this,
            chartDiv = commentObj.chartDiv,
            binding = comment.binding,
            chartAreaWidth = chartDiv._groups[0][0].clientWidth,
            chartAreaHeight = chartDiv._groups[0][0].clientHeight,
            x = (binding.x / binding.clientWidth * chartAreaWidth),
            y = (binding.y / binding.clientHeight * chartAreaHeight),
            styleString = '',
            text = '',
            resize = false;

        if (comment.binding.showAsMarker === 'false') {
            if (comment.binding.width && comment.binding.height) {
                styleString = "style='width: " + comment.binding.width + 'px; height: ' + comment.binding.height + "px'";
            }
            if (comment.commentText.indexOf('<iframe') > -1 || comment.commentText.indexOf('<img') > -1 || comment.commentText.indexOf('<svg') > -1) {
                // contains elents that should resize
                text = "<div class='comment-padding text editable editable-text editable-comment-" + id + "' " + styleString + "><div class='user-comment'>" + comment.commentText + '</div></div>';
                resize = true;
            } else {
                text = '<div class="text editable editable-text editable-comment-' + id + '">' + comment.commentText + '<div/>';
            }
            chartDiv.append('div')
                .attr('class', 'min-comment')
                .attr('id', 'node' + id)
                .style('opacity', 1)
                .style('position', 'absolute')
                .style('left', x + 'px')
                .style('top', y + 'px')
                .on('dblclick', function () {// Edit text or delete the comment
                    commentObj.doubleClick.call(commentObj, this, x, y);
                })
                // creating div for styling purposes
                .append('div')
                .attr('class', 'min-comment-styling')
                // .style("border", "1px solid black")
                .html(text);
            if (resize) {
                let parent = d3.select('.user-comment');
                if (parent.node()) {
                    jvComment.rescale(parent, parent.node());
                }
            }
        } else {
            chartDiv.append('div')
                .attr('class', 'min-comment')
                .attr('id', 'node' + id)
                .style('opacity', 1)
                .style('position', 'absolute')
                .style('left', x + 'px')
                .style('top', y + 'px')
                .style('font-family', 'FontAwesome')
                .style('stroke', 'darkgray')
                .style('font-size', '15px')
                .html('\uf0e5')
                .on('dblclick.comment', function () {// Edit text or delete the comment
                    commentObj.doubleClick.call(commentObj, this, x, y);
                })
                .on('mouseenter.comment', function () {// Show hover over box when mouse enters node
                    if (commentObj.showComments === false) {
                        let commentHeight = 80,
                            commentWidth = 185,
                            position;

                        Object.values(commentObj.comments.list)
                            .filter(value => jvComment.isSameLocation(value.binding.x, this.offsetLeft, value.binding.y, this.offsetTop))
                            .forEach(node => {
                                position = commentObj.overlayDivPosition(commentWidth, commentHeight, node.binding.x, node.binding.y);
                                chartDiv.append('div')
                                    .attr('class', 'commentbox-readonly')
                                    .style('opacity', 1)
                                    .style('position', 'absolute')
                                    .html("<textarea readonly rows='4' cols='27' class='textarea' name='comment'>" + node.commentText + '</textarea>')
                                    .style('left', position.x + 'px')
                                    .style('top', position.y + 'px');
                            });
                    }
                })
                // Remove hover over box when mouse moves away
                .on('mouseout.comment', () => !commentObj.showComments && chartDiv.select('.commentbox-readonly').remove());
        }
    }

    static isSameLocation(x1, x2, y1, y2, v) {
        return Math.round(x1) === Math.round(x2) && Math.round(y1) === Math.round(y2);
    }

    /**
    * @name doubleClick
    * @desc click function after the user clicks on an existing comment
    * @param {object} commentNode - current comment that the user clicked
    * @param {number} x - x position of the click event
    * @param {number} y - y position of the click event
    * @return {undefined} - no return
    */
    doubleClick(commentNode, x, y) {
        d3.event.stopPropagation();
        let commentObj = this,
            editBox,
            chartDiv = commentObj.chartDiv,
            commentId = commentNode.id.split('node')[1],
            currentComment = commentObj.comments.list[commentId],
            commentHeight = 145,
            commentWidth = 200,
            position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y),
            mode = commentObj.getMode();
        if (chartDiv.select('.commentbox-edit')._groups[0][0] || (mode !== 'comment-mode' && mode !== 'commentMode')) {
            // dont create new comment
            return;
        }

        commentObj.showComments = false;
        chartDiv.selectAll('.commentbox-readonly').remove();
        chartDiv.selectAll('.commentbox-edit').remove();
        chartDiv.selectAll('.commentbox').remove();

        editBox = chartDiv.append('div')
            .attr('class', 'commentbox-edit')
            .style('opacity', 1)
            .style('left', position.x + 'px')
            .style('top', position.y + 'px')
            .style('position', 'absolute')
            .html(commentTemplates.edit(currentComment.commentText));

        editBox.select('#display')._groups[0][0].checked = currentComment.binding.showAsMarker === 'true';
        editBox.select('#global')._groups[0][0].checked = currentComment.alwaysDisplay === true;

        editBox.select('#delete')
            .on('click.delete', function () {
                editBox.remove();
                chartDiv.select('.commentbox-readonly').remove();
                chartDiv.select('#node' + commentId).attr('display', 'none');
                // redraw comment nodes with new indexes
                commentObj.onSaveCallback(currentComment, commentId, 'remove');
            });

        editBox.select('#save')
            .on('click.save', function () {
                let showAsMarker = editBox.select('#display')._groups[0][0].checked;
                currentComment.commentText = editBox.select('#edit')._groups[0][0].value;
                currentComment.binding.showAsMarker = showAsMarker ? 'true' : 'false';
                chartDiv.select('.commentbox-readonly').remove();
                editBox.remove();
                commentObj.onSaveCallback(currentComment, commentId, 'edit');
            });

        editBox.select('#cancel-edit')
            .on('click.cancel-edit', function () {
                chartDiv.select('.commentbox-readonly').remove();
                editBox.remove();
            });
    }

    /**
    * @name overlayDivPosition
    * @desc function to determine the placement of the div on the visual
    * @param {number} divWidth - width of the comment entry box
    * @param {number} divHeight - height of the comment entry box
    * @param {number} mouseX - x position of the click event
    * @param {number} mouseY - y position of the click event
    * @return {object} - position of div
    */
    overlayDivPosition(divWidth, divHeight, mouseX, mouseY) {
        let editObj = this,
            position = {
                x: mouseX,
                y: mouseY + 10
            };
        if (mouseX > parseInt(editObj.chartDiv.style('width'), 10) / 2) {
            position.x = mouseX - divWidth;
        }
        if (mouseY - divHeight - 10 > 0) {
            position.y = mouseY - divHeight - 10;
        }
        return position;
    }

    /**
    * @name setCommentsList
    * @desc sets the appropriate comments object for a comments object
    * @param {object} comments - list of comments to paint
    * @return {comments} - object with comments list and max id
    */
    static setCommentsList(comments = {}) {
        let newComments =
            {
                list: {},
                maxId: 0
            },
            keys = Object.keys(comments);

        if (keys.length > 0) {
            newComments.list = comments;
            newComments.maxId = Math.max(...Object.keys(newComments.list));
            if (Number.isNaN(newComments.maxId)) {
                newComments.maxId = 0;
            }
        }
        return newComments;
    }

    /**
    * @name rescale
    * @desc sets the children of the ele param to 100 percent height and width
    * @param {d3node} ele - node to start recursive function
    * @param {htmlNode} commentNode - unused parent node that can be used to calcualte percent height and widths
    * @return {undefined} - no return
    */
    static rescale(ele, commentNode) {
        var node = ele.node(),
            width = 100,
            height = 100;
        // width = node.clientWidth / commentNode.clientWidth * 100;
        // height = node.clientHeight / commentNode.clientHeight * 100;
        // if (width > 100) {
        // width = 100;
        // }

        // if (height > 100) {
        // height = 100;
        // }

        // ignore svg nodes
        if (ele && ele.node() && (ele.node().nodeName.indexOf('DIV') > -1 || ele.node().nodeName.indexOf('IFRAME') > -1)) {
            ele.style('width', width + '%');
            ele.style('height', height + '%');
            for (let child of node.childNodes) {
                this.rescale(d3.select(child), commentNode);
            }
        }
    }
}
