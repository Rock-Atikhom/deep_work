import "@fontsource-variable/newsreader";
import "@fontsource/ibm-plex-sans";
import "./ui/tokens.css";
import "./ui/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { registerApplicationServiceWorker } from "./service-worker/client";

void registerApplicationServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
