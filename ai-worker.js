// Shark AI — skills worker: offline voice-to-text (Whisper) and image reading (Florence-2).
// Developed by MeshCode.
import {
  pipeline,
  env,
  Florence2ForConditionalGeneration,
  AutoProcessor,
  RawImage,
} from "./vendor/transformers.min.js";

env.allowLocalModels = false;
env.useBrowserCache = true;

const ASR_MODEL = "onnx-community/whisper-base";
const VISION_MODEL = "onnx-community/Florence-2-base-ft";

let devicePromise = null;
let asr = null;
let asrLoading = null;
let flo = null;
let floLoading = null;

function pickDevice() {
  if (!devicePromise) {
    devicePromise = (async () => {
      try {
        if (!self.navigator?.gpu) return "wasm";
        const adapter = await self.navigator.gpu.requestAdapter();
        return adapter ? "webgpu" : "wasm";
      } catch {
        return "wasm";
      }
    })();
  }
  return devicePromise;
}

function progressReporter(skill) {
  return (p) => {
    if (!p) return;
    self.postMessage({ type: "progress", skill, data: {
      status: p.status, file: p.file, progress: p.progress, loaded: p.loaded, total: p.total,
    } });
  };
}

async function loadAsr() {
  if (asr) return asr;
  if (!asrLoading) {
    asrLoading = (async () => {
      const device = await pickDevice();
      const opts = { device, progress_callback: progressReporter("voice") };
      opts.dtype = device === "webgpu"
        ? { encoder_model: "fp32", decoder_model_merged: "q4" }
        : "q8";
      try {
        asr = await pipeline("automatic-speech-recognition", ASR_MODEL, opts);
      } catch (e) {
        if (device !== "webgpu") throw e;
        // WebGPU failed on this device — fall back to CPU.
        asr = await pipeline("automatic-speech-recognition", ASR_MODEL, {
          device: "wasm", dtype: "q8", progress_callback: progressReporter("voice"),
        });
      }
      return asr;
    })();
    asrLoading.catch(() => { asrLoading = null; });
  }
  return asrLoading;
}

async function loadVision() {
  if (flo) return flo;
  if (!floLoading) {
    floLoading = (async () => {
      const device = await pickDevice();
      const progress_callback = progressReporter("vision");
      const build = async (dev) => {
        const dtype = dev === "webgpu"
          ? { embed_tokens: "fp16", vision_encoder: "fp16", encoder_model: "q4", decoder_model_merged: "q4" }
          : "q8";
        const model = await Florence2ForConditionalGeneration.from_pretrained(VISION_MODEL, { device: dev, dtype, progress_callback });
        const processor = await AutoProcessor.from_pretrained(VISION_MODEL, { progress_callback });
        return { model, processor };
      };
      try {
        flo = await build(device);
      } catch (e) {
        if (device !== "webgpu") throw e;
        flo = await build("wasm");
      }
      return flo;
    })();
    floLoading.catch(() => { floLoading = null; });
  }
  return floLoading;
}

async function runFlorence(image, task) {
  const { model, processor } = await loadVision();
  const inputs = await processor(image, task);
  const ids = await model.generate({ ...inputs, max_new_tokens: 320 });
  const text = processor.batch_decode(ids, { skip_special_tokens: false })[0];
  const out = processor.post_process_generation(text, task, image.size);
  const val = out[task];
  return typeof val === "string" ? val.trim() : "";
}

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === "load-voice") {
      await loadAsr();
      self.postMessage({ id, type: "result", result: true });
    } else if (type === "load-vision") {
      await loadVision();
      self.postMessage({ id, type: "result", result: true });
    } else if (type === "transcribe") {
      const t = await loadAsr();
      const opts = { chunk_length_s: 30, stride_length_s: 5, task: "transcribe" };
      if (data.language) opts.language = data.language;
      const out = await t(data.audio, opts);
      const text = Array.isArray(out) ? out.map((o) => o.text).join(" ") : out.text;
      self.postMessage({ id, type: "result", result: (text || "").trim() });
    } else if (type === "read-image") {
      const image = await RawImage.fromBlob(data.blob);
      const caption = data.caption === false ? "" : await runFlorence(image, "<MORE_DETAILED_CAPTION>");
      let ocr = "";
      if (data.ocr !== false) ocr = await runFlorence(image, "<OCR>");
      self.postMessage({ id, type: "result", result: { caption, ocr } });
    } else if (type === "ping") {
      self.postMessage({ id, type: "result", result: { device: await pickDevice() } });
    }
  } catch (e) {
    self.postMessage({ id, type: "error", error: String(e?.message || e) });
  }
};
