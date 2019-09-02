import { getLabelmap3D } from './getLabelmaps3D';
import pako from 'pako';
import { getLogger } from '../../../util/logger';
import getSegmentsOnPixelData from './getSegmentsOnPixeldata';
import external from '../../../externalModules';

const logger = getLogger('util:segmentation:labelmap3DHistory');

// TODO - Metadata! (e.g.  if you delete a segment and its metadata in one go, you probably want to be able to undo that).

function pushState(element, labelmapIndex) {
  const labelmap3D = getLabelmap3D(element, labelmapIndex);

  // TODO -> On worker.
  const Uint16View = new Uint16Array(labelmap3D.buffer);
  const compressedState = pako.deflate(Uint16View);

  labelmap3D.undo.push(compressedState);
  labelmap3D.redo = [];

  // TEMP
  logger.warn(labelmap3D.undo);
}

function undo(element, labelmapIndex) {
  const labelmap3D = getLabelmap3D(element, labelmapIndex);

  if (!labelmap3D.undo.length) {
    logger.warn('No undos left!');
    return;
  }

  // Get current state and push it to redo.

  const Uint16View = new Uint16Array(labelmap3D.buffer);
  const compressedState = pako.deflate(Uint16View);

  labelmap3D.redo.push(compressedState);

  logger.warn(labelmap3D.undo);
  logger.warn(labelmap3D.redo);

  // Pop undo stack and apply.
  const oldCompressedState = labelmap3D.undo.pop();

  // Inflate and apply
  applyState(labelmap3D, oldCompressedState, element);
}

console.log(undo);

function redo(element, labelmapIndex) {}

export { pushState, undo, redo };

function applyState(labelmap3D, compressedState, element) {
  logger.warn('Apply state');

  const inflatedState = pako.inflate(compressedState);

  const enabledElement = external.cornerstone.getEnabledElement(element);

  const { rows, columns } = enabledElement.image;

  const sliceLengthInUint16 = rows * columns;
  const slicelengthInBytes = sliceLengthInUint16 * 2;
  const numberOfFrames = inflatedState.length / slicelengthInBytes;

  labelmap3D.buffer = inflatedState;

  const { labelmaps2D } = labelmap3D;

  for (let i = 0; i < numberOfFrames; i++) {
    const pixelData = new Uint16Array(
      labelmap3D.buffer,
      slicelengthInBytes * i,
      sliceLengthInUint16
    );

    const segmentsOnLabelmap = getSegmentsOnPixelData(pixelData);

    if (segmentsOnLabelmap.some(segment => segment)) {
      labelmaps2D[i] = {
        pixelData,
        segmentsOnLabelmap,
      };
    }
  }

  external.cornerstone.updateImage(element);
}
