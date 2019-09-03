//importScripts('pako');

self.onmessage = function(e) {
  console.log('Worker: Message received from main script');
  console.log(e.data[0]);

  //const deflated = pako.deflate(e.data[0]);
  const deflated = e.data[0];

  self.postMessage(deflated);
};
