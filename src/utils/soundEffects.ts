// Web Audio API stadium sound effects generator

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play referee whistle sound
export function playWhistleSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(2800, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.warn("Audio synthesis error:", err);
  }
}

// Play Goal Roar / Cheer sound
export function playGoalCheerSound() {
  try {
    const ctx = getAudioContext();
    
    // Create pink noise for crowd roar
    const bufferSize = ctx.sampleRate * 2.5; // 2.5 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // scale down
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it sound like stadium roar
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.Q.setValueAtTime(0.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Also trigger a whistle
    playWhistleSound();

    noise.start();
    noise.stop(ctx.currentTime + 2.5);
  } catch (err) {
    console.warn("Audio synthesis error:", err);
  }
}

// Continuous ambient crowd hum node
let ambientGainNode: GainNode | null = null;
let ambientSource: AudioBufferSourceNode | null = null;

export function toggleStadiumAmbiance(enable: boolean): boolean {
  try {
    const ctx = getAudioContext();

    if (!enable) {
      if (ambientGainNode && ambientSource) {
        ambientGainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        setTimeout(() => {
          try {
            ambientSource?.stop();
            ambientSource?.disconnect();
          } catch (e) {}
          ambientSource = null;
          ambientGainNode = null;
        }, 500);
      }
      return false;
    }

    if (ambientSource) return true; // Already playing

    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.05;
    }

    ambientSource = ctx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, ctx.currentTime);

    ambientGainNode = ctx.createGain();
    ambientGainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    ambientGainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.0);

    ambientSource.connect(filter);
    filter.connect(ambientGainNode);
    ambientGainNode.connect(ctx.destination);

    ambientSource.start();
    return true;
  } catch (err) {
    console.warn("Failed stadium audio:", err);
    return false;
  }
}
