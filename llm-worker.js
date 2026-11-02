// Shark AI — chat model worker (runs the language model off the main thread).
// Developed by MeshCode.
import { WebWorkerMLCEngineHandler } from "./vendor/web-llm.js";

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
