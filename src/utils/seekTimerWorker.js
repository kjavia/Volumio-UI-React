// Web Worker for seek timer — runs on a separate thread, immune to tab throttling.
// All seek values are in milliseconds.

let seek = 0;
let timer = null;
let max = 0;
let dateMillis = 0;

onmessage = (e) => {
  const command = e.data.command;
  switch (command) {
    case 'start':
      startTimer(e.data.beginSeek, e.data.max);
      break;
    case 'pause':
      pauseTimer(e.data.pauseSeek, e.data.max);
      break;
    case 'stop':
      stopTimer();
      break;
    default:
      break;
  }
};

function startTimer(beginSeek, maxVal) {
  clearTimer();
  seek = beginSeek;
  dateMillis = Date.now();
  setMax(maxVal);
  if (!timer) {
    timer = setInterval(() => {
      const lastDateMillis = dateMillis;
      dateMillis = Date.now();
      const realElapsed = dateMillis - lastDateMillis;
      seek = Math.min(seek + realElapsed, max);
      postMessage({ event: 'seek', seek });
      if (seek >= max) {
        clearTimer();
      }
    }, 500);
  }
}

function pauseTimer(pauseSeek, maxVal) {
  clearTimer();
  if (pauseSeek !== undefined) {
    seek = Math.min(pauseSeek, max);
  }
  setMax(maxVal);
}

function stopTimer() {
  clearTimer();
  seek = 0;
  postMessage({ event: 'seek', seek: 0 });
}

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function setMax(value) {
  max = value;
  if (seek > max) {
    seek = max;
  }
  postMessage({ event: 'seek', seek });
}
