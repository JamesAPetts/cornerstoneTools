import { getToolState } from '../../../stateManagement/toolState.js';
import getElement from './getElement';
import state from './state';

/**
 * Returns the `Labelmap3D` objects associated with the series displayed
 * in the element, the `activeLabelmapIndex` and the `currentImageIdIndex`.
 *
 * @param  {HTMLElement|string} elementOrEnabledElementUID   The cornerstone enabled
 *                                                    element or its UUID.
 * @returns {Object}              An object containing `Labelmap3D` objects,
 *                                the `activeLabelmapIndex`, the firstImageId and the `currentImageIdIndex`.
 */
export default function getLabelmaps3D(elementOrEnabledElementUID) {
  const element = getElement(elementOrEnabledElementUID);

  if (!element) {
    return;
  }

  const stackState = getToolState(element, 'stack');
  const stackData = stackState.data[0];

  const firstImageId = stackData.imageIds[0];
  const brushStackState = state.series[firstImageId];

  let labelmaps3D;
  let activeLabelmapIndex;

  if (brushStackState) {
    labelmaps3D = brushStackState.labelmaps3D;
    activeLabelmapIndex = brushStackState.activeLabelmapIndex;
  }

  return {
    labelmaps3D,
    activeLabelmapIndex,
    firstImageId,
    currentImageIdIndex: stackData.currentImageIdIndex,
  };
}

/**
 * Returns a single `Labelmap3D` object associated with the series displayed
 * in the element.
 *
 * @param  {HTMLElement|string} elementOrEnabledElementUID   The cornerstone enabled
 *                                                    element or its UUID.
 * @param  {number} [labelmapIndex] The index of the `Labelmap3D` to retrieve. Defaults to
 *                                  the `activeLabelmapIndex`.
 * @returns {Object}              A `Labelmap3D` object.
 */
export function getLabelmap3D(elementOrEnabledElementUID, labelmapIndex) {
  const { labelmaps3D, activeLabelmapIndex, firstImageId } = getLabelmaps3D(
    elementOrEnabledElementUID
  );

  labelmapIndex =
    labelmapIndex !== undefined ? labelmapIndex : activeLabelmapIndex;

  return {
    labelmap3D: labelmaps3D[labelmapIndex],
    firstImageId,
    labelmapIndex,
  };
}
