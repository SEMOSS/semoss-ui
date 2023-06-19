export default {
  draw: function (context, size) {
    const height = Math.sqrt(size)

    context.moveTo(0, 0)
    context.bezierCurveTo(0, -height * 0.20, -height * 0.60, -height * 0.90, height * -0.025, -(height))
    context.arcTo(height * 0.025, -height, height * 0.025, -height, Math.PI * 2)
    context.bezierCurveTo(height * 0.60, -height * 0.90, 0, -height * 0.20, 0, 0)

    context.moveTo(height * 0.125, -(height * 0.7125))
    context.arc(0, -(height * 0.7125), height * 0.125, 0, Math.PI * 2, true)
  }
}
