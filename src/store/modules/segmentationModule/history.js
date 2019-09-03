import { getLabelmap3D } from './getLabelmaps3D';
import pako from 'pako';
import { getLogger } from '../../../util/logger';
import getSegmentsOnPixelData from './getSegmentsOnPixeldata';
import external from '../../../externalModules';
import deflatorWorker from './workers/deflatorWorker';
import configuration from './configuration';
import throttle from '../../../util/throttle';
import debounce from '../../../util/debounce';

const logger = getLogger('util:segmentation:labelmap3DHistory');

// TODO - Metadata? (e.g.  if you delete a segment and its metadata in one go, you probably want to be able to undo that).
// Depends on implementation, whether you delete a label name/definition when you delete a segment.

const pushState = debounce(_pushState, 200, { leading: true });

function _pushState(element, labelmapIndex) {
  if (!configuration.storeHistory) {
    return;
  }

  const result = getLabelmap3D(element, labelmapIndex);
  const { labelmap3D, firstImageId } = result;

  labelmapIndex = result.labelmapIndex;

  const time = performance.now();

  if (configuration.useWorkerForBackgroundCompression) {
    labelmap3D.compressQueueLength++;

    console.log('posting message');
    deflatorWorker.worker.postMessage([
      labelmap3D.buffer.slice(0),
      firstImageId,
      labelmapIndex,
      time,
    ]);

    return;
  }

  const compressedState = pako.deflate(labelmap3D.buffer);

  //TEMP
  logger.warn('pushState: undo, redo:');

  labelmap3D.undo.push({
    time,
    compressedState,
  });
  labelmap3D.redo = [];

  // TEMP
  logger.warn(labelmap3D.undo);
  logger.warn(labelmap3D.redo);
}

function undo(element, labelmapIndex) {
  const { labelmap3D } = getLabelmap3D(element, labelmapIndex);

  if (labelmap3D.compressQueueLength > 0) {
    // TODO -> Find a better solution for this.
    return;
  }

  if (!labelmap3D.undo.length) {
    logger.warn('No undos left!');
    return;
  }

  // Get current state and push it to redo.
  const compressedState = pako.deflate(labelmap3D.buffer);

  labelmap3D.redo.push({
    time: performance.now(),
    compressedState,
  });

  // Pop undo stack and apply.
  const oldCompressedState = labelmap3D.undo.pop();

  logger.warn('undo: undo, redo:');
  logger.warn(labelmap3D.undo);
  logger.warn(labelmap3D.redo);

  // Inflate and apply
  applyState(labelmap3D, oldCompressedState, element);
}

function redo(element, labelmapIndex) {
  const { labelmap3D } = getLabelmap3D(element, labelmapIndex);

  if (!labelmap3D.redo.length) {
    logger.warn('No redos left!');
    return;
  }

  // Get current state and push it to undo.
  const compressedState = pako.deflate(labelmap3D.buffer);

  labelmap3D.undo.push({
    time: performance.now(),
    compressedState,
  });

  // Pop undo stack and apply.
  const oldCompressedState = labelmap3D.redo.pop();

  logger.warn('undo: undo, redo:');
  logger.warn(labelmap3D.undo);
  logger.warn(labelmap3D.redo);

  // Inflate and apply
  applyState(labelmap3D, oldCompressedState, element);
}

export { pushState, undo, redo };

function applyState(labelmap3D, compressedStateObj, element) {
  const { compressedState } = compressedStateObj;
  const inflatedState = pako.inflate(compressedState);

  const enabledElement = external.cornerstone.getEnabledElement(element);

  const { rows, columns } = enabledElement.image;

  const sliceLength = rows * columns;
  const slicelengthInBytes = sliceLength * 2;
  const numberOfFrames = inflatedState.length / slicelengthInBytes;

  labelmap3D.buffer = inflatedState.buffer;
  labelmap3D.labelmaps2D = [];

  const { labelmaps2D } = labelmap3D;

  for (let i = 0; i < numberOfFrames; i++) {
    const pixelData = new Uint16Array(
      labelmap3D.buffer,
      slicelengthInBytes * i,
      sliceLength
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
