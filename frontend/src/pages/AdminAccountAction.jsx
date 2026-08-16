import { apiBaseUrl } from "../config/api.js";
import {
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import "./AdminAccountAction.css";

function readStoredContext() {
  const stored =
    sessionStorage.getItem(
      "velocityAdminActionContext"
    );

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

async function readResponse(response) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

function AdminAccountAction() {
  const location = useLocation();
  const navigate = useNavigate();

  const [context] = useState(
    () =>
      location.state ||
      readStoredContext()
  );

  const [reason, setReason] =
    useState("");

  const [error, setError] =
    useState("");

  const [working, setWorking] =
    useState(false);

  const adminToken =
    sessionStorage.getItem(
      "adminToken"
    ) ||
    localStorage.getItem(
      "adminToken"
    );

  const action =
    String(
      context?.action || ""
    ).toUpperCase();

  const userId =
    Number(context?.userId);

  const validContext =
    (action === "SUSPEND" ||
      action === "REACTIVATE") &&
    Number.isInteger(userId) &&
    userId > 0;

  const suspending =
    action === "SUSPEND";

  const accountLabel =
    `${context?.role || "Account"} ${
      context?.name || ""
    }`.trim();

  const leaveScreen = () => {
    sessionStorage.removeItem(
      "velocityAdminActionContext"
    );

    navigate(
      "/admin/feedback",
      {
        replace: true,
      }
    );
  };

  const submitAction =
    async (event) => {
      event.preventDefault();

      if (!validContext) {
        setError(
          "This account action is no longer available. Return to Feedback and choose the account again."
        );
        return;
      }

      const cleanReason =
        reason.trim();

      if (
        suspending &&
        !cleanReason
      ) {
        setError(
          "Enter a reason before suspending this account."
        );
        return;
      }

      setWorking(true);
      setError("");

      try {
        const response = await fetch(
          `${apiBaseUrl}/admin/users/${userId}/${
            suspending
              ? "suspend"
              : "reactivate"
          }`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${adminToken}`,
              ...(suspending
                ? {
                    "Content-Type":
                      "application/json",
                  }
                : {}),
            },
            ...(suspending
              ? {
                  body: JSON.stringify({
                    reason: cleanReason,
                  }),
                }
              : {}),
          }
        );

        const data =
          await readResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.details ||
              `Request failed with status ${response.status}.`
          );
        }

        sessionStorage.setItem(
          "velocityAdminNotice",
          data.message ||
            `${accountLabel} was ${
              suspending
                ? "suspended"
                : "reactivated"
            }.`
        );

        sessionStorage.removeItem(
          "velocityAdminActionContext"
        );

        navigate(
          "/admin/feedback",
          {
            replace: true,
          }
        );
      } catch (actionError) {
        setError(
          actionError.message
        );
      } finally {
        setWorking(false);
      }
    };

  if (!validContext) {
    return (
      <main className="admin-account-action-page">
        <section className="admin-account-action-card admin-account-action-missing">
          <ShieldCheck size={48} />

          <span className="admin-page-eyebrow">
            Account action
          </span>

          <h1>
            Select an account first
          </h1>

          <p>
            Return to Admin Feedback and
            choose Suspend or Reactivate
            on the account you want to
            manage.
          </p>

          <button
            type="button"
            className="admin-account-primary"
            onClick={leaveScreen}
          >
            Return to Feedback
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-account-action-page">
      <section className="admin-account-action-card">
        <div
          className={
            `admin-account-action-icon ${
              suspending
                ? "warning"
                : "success"
            }`
          }
        >
          {suspending ? (
            <AlertTriangle size={32} />
          ) : (
            <CheckCircle2 size={32} />
          )}
        </div>

        <span className="admin-page-eyebrow">
          Account action
        </span>

        <h1>
          {suspending
            ? "Suspend account"
            : "Reactivate account"}
        </h1>

        <p className="admin-account-action-intro">
          {suspending
            ? "Review the account and record why access should be suspended."
            : "Review the account before restoring its access to Velocity."}
        </p>

        <div className="admin-account-summary">
          <UserRound size={24} />

          <div>
            <span>
              {context.role ||
                "Account"}
            </span>

            <strong>
              {context.name ||
                "Unknown account"}
            </strong>

            <small>
              User #{userId}
              {context.feedbackId
                ? ` · Feedback #${context.feedbackId}`
                : ""}
              {context.rideId
                ? ` · Ride #${context.rideId}`
                : ""}
            </small>
          </div>
        </div>

        <form onSubmit={submitAction}>
          {suspending && (
            <label className="admin-account-reason">
              <span>
                Suspension reason
              </span>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                rows={5}
                maxLength={500}
                placeholder="Explain the reason for this suspension..."
                disabled={working}
                autoFocus
              />

              <small>
                This reason is stored with
                the account action.
              </small>
            </label>
          )}

          <div
            className={
              `admin-account-impact ${
                suspending
                  ? "warning"
                  : "success"
              }`
            }
          >
            {suspending
              ? "The user will lose access until an administrator reactivates the account."
              : "The user will regain access immediately after this action succeeds."}
          </div>

          {error && (
            <p
              className="admin-account-action-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="admin-account-action-buttons">
            <button
              type="button"
              className="admin-account-secondary"
              onClick={leaveScreen}
              disabled={working}
            >
              {suspending
                ? "Keep Account Active"
                : "Keep Account Suspended"}
            </button>

            <button
              type="submit"
              className={
                suspending
                  ? "admin-account-danger"
                  : "admin-account-primary"
              }
              disabled={working}
            >
              {working
                ? "Saving..."
                : suspending
                  ? "Suspend Account"
                  : "Reactivate Account"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default AdminAccountAction;
