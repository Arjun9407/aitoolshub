import { Component, Suspense } from "react";
import { FREE_TOOL_COMPONENTS } from "./freeToolWidgets.jsx";
import { FILE_FREE_TOOL_COMPONENTS } from "../data/index.js";

const ALL_COMPONENTS = { ...FREE_TOOL_COMPONENTS, ...FILE_FREE_TOOL_COMPONENTS };
import { hexToRgba } from "../utils.js";

// A crash inside one tool should never blank the whole page.
class ToolErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error("Free tool crashed:", error);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="ft-result bad" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <b>Something went wrong with this tool.</b>
          <span className="ft-hint">{String(this.state.error.message || this.state.error)}</span>
          <button className="ft-btn ghost" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function FreeToolBody({ tool }) {
  const Tool = ALL_COMPONENTS[tool.action];
  return (
    <>
      <div className="modal-tool-header">
        <div className="modal-tool-icon" style={{ background: hexToRgba(tool.color, 0.15), color: tool.color, fontSize: "1.6rem" }}>
          {tool.icon}
        </div>
        <div>
          <div className="modal-tool-name">{tool.name}</div>
          <div className="modal-tool-cat">Free tool · runs in your browser</div>
        </div>
      </div>
      <div className="ft-body">
        {Tool ? (
          <ToolErrorBoundary key={tool.action}>
            <Suspense fallback={<div className="ft-hint" style={{ padding: 24, textAlign: "center" }}>Loading tool…</div>}>
              <Tool />
            </Suspense>
          </ToolErrorBoundary>
        ) : (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: "3rem" }}>🚀</div>
            <p className="ft-hint">This tool is coming soon.</p>
          </div>
        )}
      </div>
    </>
  );
}
