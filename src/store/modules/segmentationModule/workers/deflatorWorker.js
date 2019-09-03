import LabelmapDeflatorWorker from './labelmapDeflator.worker.js';
import state from '../state';

let deflatorWorker = {};

export function initDeflatorWorker() {
  console.log('init deflatorWorker');

  deflatorWorker.worker = new LabelmapDeflatorWorker();

  deflatorWorker.worker.onmessage = function(e) {
    console.log('Message received from worker');
    console.log(e.data);

    const [compressedState, firstImageId, labelmapIndex, timestamp] = e.data;
    const labelmap3D = state.series[firstImageId].labelmaps3D[labelmapIndex];

    const { undo } = labelmap3D;

    if (undo.length === 0 || timestamp > undo[undo.length - 1]) {
      // Undo stack empty, or timestamp greater than last element, stack on the end.
      undo.push({
        time: timestamp,
        compressedState,
      });
    } else {
      // Find out where to insert the undo operaton and put it there.
      let undoInsertIndex;

      for (let i = undo.length - 1; i >= 0; i--) {
        if (undo[i].time < timestamp) {
          undoInsertIndex = i + 1;

          break;
        }
      }

      undo.splice(undoInsertIndex, 0, {
        time: timestamp,
        compressedState,
      });
    }

    labelmap3D.redo = [];

    labelmap3D.compressQueueLength--;

    if (labelmap3D.compressQueueLength < 0) {
      labelmap3D.compressQueueLength = 0;
    }

    console.log(labelmap3D.undo);
    console.log(labelmap3D.redo);
    console.log(labelmap3D.compressQueueLength);
  };
}

export default deflatorWorker;
