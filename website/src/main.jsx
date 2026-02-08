/**
 * main.jsx
 *
 * React entry point for the Vantage website.
 * Mounts the root App component and imports global styles.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
