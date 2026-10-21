import { ArrayBufferTarget, Muxer } from 'mp4-muxer';

export const CAPTURE_VIEWPORT = { width: 1206, height: 2532, frameRate: 60 } as const;
export type RecordingPhase = 'idle' | 'preparing' | 'recording' | 'stopping' | 'encoding' | 'ready' | 'error';

type TrackProcessor = { readable: ReadableStream<VideoFrame> };
type TrackProcessorConstructor = new (options: { track: MediaStreamTrack }) => TrackProcessor;

function timestampedFilename() {
  const stamp = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date()).replace(/[ :]/g, '-');
  return `scrapbook-demo-${stamp}.mp4`;
}

export function downloadMp4(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = timestampedFilename();
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Captures a user-selected browser tab and creates an AVC/H.264 MP4; no screen pixels are recorded. */
export class ShowcaseRecorder {
  private stream: MediaStream | null = null;
  private reader: ReadableStreamDefaultReader<VideoFrame> | null = null;
  private encoder: VideoEncoder | null = null;
  private muxer: Muxer<ArrayBufferTarget> | null = null;
  private target: ArrayBufferTarget | null = null;
  private stopped = false;
  private startedAt: number | null = null;
  private frameCount = 0;
  private canvas: OffscreenCanvas | null = null;
  private context: OffscreenCanvasRenderingContext2D | null = null;
  private encoderError: Error | null = null;
  private pumpPromise: Promise<void> | null = null;

  async start() {
    if (!('VideoEncoder' in window)) throw new Error('This browser does not support WebCodecs H.264 encoding. Use current Chrome or Edge.');
    const Processor = (window as unknown as { MediaStreamTrackProcessor?: TrackProcessorConstructor }).MediaStreamTrackProcessor;
    if (!Processor) throw new Error('This browser cannot read a captured tab as video frames. Use current Chrome or Edge.');

    this.stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: CAPTURE_VIEWPORT.frameRate }, width: { ideal: CAPTURE_VIEWPORT.width }, height: { ideal: CAPTURE_VIEWPORT.height } },
      audio: false,
      preferCurrentTab: false,
      selfBrowserSurface: 'exclude',
      surfaceSwitching: 'exclude',
    } as DisplayMediaStreamOptions);
    const track = this.stream.getVideoTracks()[0];
    if (!track) throw new Error('No video track was supplied. Select the “Scrapbook recording” browser tab and try again.');
    const settings = track.getSettings();
    if ((settings.width ?? 0) < CAPTURE_VIEWPORT.width || (settings.height ?? 0) < CAPTURE_VIEWPORT.height) {
      this.cleanup();
      throw new Error(`The selected tab is only ${settings.width ?? '?'} × ${settings.height ?? '?'} px. Select the dedicated recording tab at full size; it must provide ${CAPTURE_VIEWPORT.width} × ${CAPTURE_VIEWPORT.height} px.`);
    }

    this.target = new ArrayBufferTarget();
    this.muxer = new Muxer({ target: this.target, video: { codec: 'avc', width: CAPTURE_VIEWPORT.width, height: CAPTURE_VIEWPORT.height, frameRate: CAPTURE_VIEWPORT.frameRate }, fastStart: false, firstTimestampBehavior: 'offset' });
    this.encoder = new VideoEncoder({ output: (chunk, meta) => this.muxer?.addVideoChunk(chunk, meta), error: (error) => { this.encoderError = error; this.stopped = true; } });
    const support = await VideoEncoder.isConfigSupported({ codec: 'avc1.640028', width: CAPTURE_VIEWPORT.width, height: CAPTURE_VIEWPORT.height, bitrate: 28_000_000, framerate: CAPTURE_VIEWPORT.frameRate, avc: { format: 'avc' } });
    if (!support.supported || !support.config) { this.cleanup(); throw new Error('Hardware H.264 encoding at 1206 × 2532 is unavailable in this browser.'); }
    this.encoder.configure(support.config);
    this.canvas = new OffscreenCanvas(CAPTURE_VIEWPORT.width, CAPTURE_VIEWPORT.height);
    this.context = this.canvas.getContext('2d', { alpha: false });
    this.reader = new Processor({ track }).readable.getReader();
    track.addEventListener('ended', () => { this.stopped = true; });
    this.pumpPromise = this.pump();
  }

  private async pump() {
    if (!this.reader || !this.encoder) return;
    try {
      while (!this.stopped) {
        const { value, done } = await this.reader.read();
        if (done || !value) break;
        const timestamp = value.timestamp;
        this.startedAt ??= timestamp;
        // The capture tab is deliberately rendered at the export dimensions. Drawing to a
        // same-sized canvas makes bounds deterministic without scaling a low-res preview.
        this.context?.drawImage(value, 0, 0, CAPTURE_VIEWPORT.width, CAPTURE_VIEWPORT.height);
        value.close();
        if (!this.canvas) throw new Error('The recording canvas was not initialized.');
        const output = new VideoFrame(this.canvas, { timestamp: timestamp - this.startedAt });
        while (!this.stopped && this.encoder.encodeQueueSize > 4) await new Promise<void>((resolve) => window.setTimeout(resolve, 4));
        if (this.stopped) { output.close(); break; }
        this.encoder.encode(output, { keyFrame: this.frameCount % (CAPTURE_VIEWPORT.frameRate * 2) === 0 });
        output.close();
        this.frameCount += 1;
      }
    } catch (error) {
      console.error('Showcase recording frame capture failed', error);
      this.stopped = true;
    }
  }

  async stop(): Promise<Blob> {
    this.stopped = true;
    await this.reader?.cancel();
    await this.pumpPromise;
    this.stream?.getTracks().forEach((track) => track.stop());
    await this.encoder?.flush();
    if (this.encoderError) throw this.encoderError;
    this.encoder?.close();
    this.muxer?.finalize();
    if (!this.target?.buffer) throw new Error('The recording did not produce an MP4 file.');
    const result = new Blob([this.target.buffer], { type: 'video/mp4' });
    this.cleanup(false);
    return result;
  }

  cancel() { this.stopped = true; this.cleanup(); }

  private cleanup(closeEncoder = true) {
    void this.reader?.cancel();
    this.reader = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (closeEncoder && this.encoder?.state !== 'closed') this.encoder?.close();
    this.encoder = null;
    this.canvas = null;
    this.context = null;
  }
}
