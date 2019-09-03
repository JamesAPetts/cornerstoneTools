import { getLabelmap3D } from './getLabelmaps3D';
import pako from 'pako';
import { getLogger } from '../../../util/logger';
import getSegmentsOnPixelData from './getSegmentsOnPixeldata';
import external from '../../../externalModules';
import LabelmapDeflatorWorker from './labelmapDeflator.worker.js';

const logger = getLogger('util:segmentation:labelmap3DHistory');

const deflatorWorker = new LabelmapDeflatorWorker();

console.log(deflatorWorker);

deflatorWorker.onmessage = function(e) {
  console.log('Message received from worker');
  console.log(e.data[0]);
};

// TODO - Metadata! (e.g.  if you delete a segment and its metadata in one go, you probably want to be able to undo that).

function pushState(element, labelmapIndex) {
  const labelmap3D = getLabelmap3D(element, labelmapIndex);

  console.log('posting message');
  //deflatorWorker.postMessage([labelmap3D.buffer.slice(0)]);
  deflatorWorker.postMessage(['hi']);

  // TEMP
  return;

  // TODO -> On worker.
  const compressedState = pako.deflate(labelmap3D.buffer);

  //TEMP
  logger.warn('pushState: undo, redo:');

  labelmap3D.undo.push({
    time: performance.now(),
    compressedState,
  });
  labelmap3D.redo = [];

  // TEMP
  logger.warn(labelmap3D.undo);
  logger.warn(labelmap3D.redo);
}

function undo(element, labelmapIndex) {
  const labelmap3D = getLabelmap3D(element, labelmapIndex);

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
  const labelmap3D = getLabelmap3D(element, labelmapIndex);

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
