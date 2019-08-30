import { getMetadata, setMetadata } from './metadata';
import {
  getActiveLabelmapIndex,
  setActiveLabelmapIndex,
} from './activeLabelmapIndex';
import {
  getActiveSegmentIndex,
  setActiveSegmentIndex,
  incrementActiveSegmentIndex,
  decrementActiveSegmentIndex,
} from './activeSegmentIndex';
import {
  isSegmentVisible,
  toggleSegmentVisibility,
} from './segmentVisibility.js';
import {
  getLabelmapBuffers,
  getActiveLabelmapBuffer,
} from './getLabelmapBuffers';
import {
  setLabelmap3DByFirstImageId,
  setLabelmap3DForElement,
} from './setLabelmap3D.js';
import getLabelmapStats from './getLabelmapStats';
import getLabelmaps3D from './getLabelmaps3D';
import getLabelmap2D, { getLabelmap2DByImageIdIndex } from './getLabelmap2D';
import getSegmentOfActiveLabelmapAtEvent from './getSegmentOfActiveLabelmapAtEvent';
import setColorLUT, { setColorLUTIndexForLabelmap3D } from './setColorLUT';
import getBrushColor from './getBrushColor';
import getSegmentsOnPixelData from './getSegmentsOnPixeldata';
import deleteSegment from './deleteSegment';

import state from './state';
import configuration from './configuration';

/**
 * A map of `firstImageId` to associated `BrushStackState`, where
 * `firstImageId` is the `imageId` of the first image in a stack.
 *
 * @typedef {Object} Series
 */

/**
 * @typedef {Object} BrushStackState An object defining a set of 3D labelmaps
 *    associated with a specific cornerstone stack.
 * @property {number} activeLabelmapIndex The index of the active `Labelmap3D`.
 * @property {Labelmap3D[]} labelmaps3D An array of `Labelmap3D` objects.
 */

/**
 * A 3D labelmap object which stores the labelmap data for an entire stack of cornerstone images.
 *
 * @typedef {Object} Labelmap3D An object defining a 3D labelmap.
 * @property {ArrayBuffer}  buffer An array buffer to store the pixel data of the `Labelmap3D` (2 bytes/voxel).
 * @property {Labelmap2D[]} labelmaps2D array of `labelmap2D` views on the `buffer`, indexed by in-stack
 *                          image positions.
 * @property {Object[]} metadata An array of metadata per segment. Metadata is optional and its form is
 *                               application specific.
 * @property {number} activeSegmentIndex The index of the active segment for this `Labelmap3D`.
 * @property {boolean[]} segmentsHidden The visibility of segments on this labelmap.
 * If an element is `true`, the element is hidden. If it `false|undefined`, the segment is visible.
 */

/**
 * A 2D labelmap object which accesses only one frame's worth of data from its parent `Labelmap3D`.
 *
 * @typedef {Object} Labelmap2D An object defining a 2D view on a section of a `Labelmap3D`'s `buffer`.
 * @property {Uint16Array} pixelData A 2D view on a section of the parent `Labelmap3D`'s `buffer`.
 * @property {number[]} segmentsOnLabelmap An array of segments present in the `pixelData`.
 */

/**
 * OnRegisterCallback - Initialise a single default colorLUT when cornerstoneTools is initialised.
 *
 * @returns {null}
 */
function onRegisterCallback() {
  setColorLUT(0);
}

export default {
  state,
  configuration,
  onRegisterCallback,
  getters: {
    metadata: getMetadata,
    labelmaps3D: getLabelmaps3D,
    activeLabelmapIndex: getActiveLabelmapIndex,
    activeSegmentIndex: getActiveSegmentIndex,
    isSegmentVisible,
    labelmap2D: getLabelmap2D,
    labelmap2DByImageIdIndex: getLabelmap2DByImageIdIndex,
    labelmapStats: getLabelmapStats,
    segmentOfActiveLabelmapAtEvent: getSegmentOfActiveLabelmapAtEvent,
    brushColor: getBrushColor,
    labelmapBuffers: getLabelmapBuffers,
    activeLabelmapBuffer: getActiveLabelmapBuffer,
  },
  setters: {
    metadata: setMetadata,
    labelmap3DForElement: setLabelmap3DForElement,
    labelmap3DByFirstImageId: setLabelmap3DByFirstImageId,
    incrementActiveSegmentIndex,
    decrementActiveSegmentIndex,
    activeSegmentIndex: setActiveSegmentIndex,
    toggleSegmentVisibility,
    updateSegmentsOnLabelmap2D: labelmap2D => {
      labelmap2D.segmentsOnLabelmap = getSegmentsOnPixelData(
        labelmap2D.pixelData
      );
    },
    deleteSegment,
    colorLUT: setColorLUT,
    colorLUTIndexForLabelmap3D: setColorLUTIndexForLabelmap3D,
    activeLabelmapIndex: setActiveLabelmapIndex,
    radius: newRadius => {
      configuration.radius = Math.min(
        Math.max(newRadius, configuration.minRadius),
        configuration.maxRadius
      );
    },
  },
};
