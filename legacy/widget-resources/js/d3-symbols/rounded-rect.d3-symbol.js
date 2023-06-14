export default {
  draw: function (context, size) {
    const w = Math.sqrt(size)
    const x = -(w / 2)
    const r = Math.sqrt(Math.sqrt(w))

    context.moveTo(x + r, x);
    context.lineTo(x + w - r, x);
    context.quadraticCurveTo(x + w, x, x + w, x + r);
    context.lineTo(x + w, x + w - r);
    context.quadraticCurveTo(x + w, x + w, x + w - r, x + w);
    context.lineTo(x + r, x + w);
    context.quadraticCurveTo(x, x + w, x, x + w - r);
    context.lineTo(x, x + r);
    context.quadraticCurveTo(x, x, x + r, x);
    context.closePath();
  }
}
