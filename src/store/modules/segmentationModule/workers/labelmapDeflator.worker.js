import pako from 'pako';

self.onmessage = function(e) {
  const { data } = e;
  const deflated = pako.deflate(e.data[0]);

  self.postMessage([deflated, data[1], data[2], data[3]]);
};
