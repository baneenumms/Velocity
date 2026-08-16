import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  X,
} from "lucide-react";

import "./DashboardNotice.css";

const NOTICE_KEY = "velocityDashboardNotice";

function DashboardNotice({ mode }) {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const rawNotice = sessionStorage.getItem(NOTICE_KEY);

    if (!rawNotice) {
      return;
    }

    try {
      const parsed = JSON.parse(rawNotice);

      if (
        String(parsed?.mode || "").toUpperCase() ===
        String(mode || "").toUpperCase()
      ) {
        setNotice(parsed);
        sessionStorage.removeItem(NOTICE_KEY);
      }
    } catch {
      sessionStorage.removeItem(NOTICE_KEY);
    }
  }, [mode]);

  if (!notice?.message) {
    return null;
  }

  return (
    <div
      className="velocity-dashboard-notice"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 size={21} />

      <span>{notice.message}</span>

      <button
        type="button"
        aria-label="Dismiss message"
        onClick={() => setNotice(null)}
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default DashboardNotice;
