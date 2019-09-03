// Segmentation module configuration.
const configuration = {
  renderOutline: true,
  renderFill: true,
  shouldRenderInactiveLabelmaps: true,
  radius: 10,
  minRadius: 1,
  maxRadius: 50,
  segmentsPerLabelmap: 65535, // Max is 65535 due to using 16-bit Unsigned ints.
  fillAlpha: 0.2,
  fillAlphaInactive: 0.05,
  outlineAlpha: 0.7,
  outlineAlphaInactive: 0.2,
  outlineWidth: 3,
};

export default configuration;
