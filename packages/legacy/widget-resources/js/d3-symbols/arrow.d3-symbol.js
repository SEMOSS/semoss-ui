export default {
  draw: function (context, size) {
    const width = Math.sqrt(size)
    const rectWidth = width / 2
    const height = width / 3

    const angle = Math.atan2(height, 0);
    const addedDegrees = Math.PI / 5

    const leftArrowX = width * Math.cos(angle + addedDegrees)
    const leftArrowY = width * Math.sin(angle + addedDegrees)

    const rightArrowX = width * Math.cos(angle - addedDegrees)
    const rightArrowY = width * Math.sin(angle - addedDegrees)

    const halfRectOffset = (width / 2) - (rectWidth / 2)
    const leftRectX = leftArrowX + halfRectOffset
    const rightRectX = rightArrowX - halfRectOffset

    context.moveTo(0, 0);

    context.lineTo(leftArrowX, -leftArrowY);
    context.lineTo(leftRectX, -leftArrowY)
    context.lineTo(leftRectX, -leftArrowY - rectWidth)
    context.lineTo(rightRectX, -rightArrowY - rectWidth);
    context.lineTo(rightRectX, -rightArrowY);
    context.lineTo(rightArrowX, -rightArrowY);
    context.lineTo(0, 0)
  }
}
