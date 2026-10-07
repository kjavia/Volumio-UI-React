export const getSmoothedLevel = (buffer, level, bufferSize) => {
  buffer.push(level);
  while (buffer.length > bufferSize) buffer.shift();
  return buffer.reduce((sum, sample) => sum + sample, 0) / buffer.length;
};

export const getMeterLevel = (level, sensitivity) => Math.max(0, Math.min(1, level * sensitivity));
