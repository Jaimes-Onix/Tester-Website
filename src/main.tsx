import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Note: no <React.StrictMode> on purpose — the imperative Three.js / GSAP effects
// should initialise exactly once.
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
