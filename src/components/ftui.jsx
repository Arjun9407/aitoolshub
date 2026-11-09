import { useApp } from "../context/AppContext.jsx";

// Shared building blocks for free tools. Import these in new tools to get a consistent look:
//   import { Area, Btn, CopyBtn, Stat, Field, words } from "../../components/ftui.jsx";
export const Area = ({ value, onChange, placeholder, rows = 6, readOnly, mono }) => (
  <textarea
    className={`ft-input ${mono ? "mono" : ""}`}
    rows={rows}
    value={value}
    readOnly={readOnly}
    placeholder={placeholder}
    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
  />
);

export const Btn = ({ children, onClick, variant = "primary", ...rest }) => (
  <button className={`ft-btn ${variant}`} onClick={onClick} {...rest}>
    {children}
  </button>
);

export function CopyBtn({ text, label = "Copy" }) {
  const { copy } = useApp();
  return (
    <Btn variant="ghost" onClick={() => copy(text)} disabled={!text}>
      <i className="fas fa-copy" /> {label}
    </Btn>
  );
}

export const Stat = ({ value, label }) => (
  <div className="ft-stat">
    <div className="ft-stat-value">{value}</div>
    <div className="ft-stat-label">{label}</div>
  </div>
);

export const Field = ({ label, children }) => (
  <label className="ft-field">
    <span>{label}</span>
    {children}
  </label>
);

export const words = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);

