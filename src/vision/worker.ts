import { createBrowserVisionDependencies } from "./runtime-loader";
import { createVisionWorkerRuntime } from "./worker-runtime";

const scope = globalThis as typeof globalThis & {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
};
const runtime = createVisionWorkerRuntime(createBrowserVisionDependencies(), (event) =>
  scope.postMessage(event),
);
scope.addEventListener("message", (event) => runtime.receive(event.data));
