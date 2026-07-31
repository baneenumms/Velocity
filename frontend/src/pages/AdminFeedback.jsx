import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import "./AdminFeedback.css";

const API =
  "http://localhost:8080";

async function readResponse(
  response
) {
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

function AdminFeedback() {
  const navigate = useNavigate();

  const adminToken =
    sessionStorage.getItem(
      "adminToken"
    );

  const isAdmin =
    sessionStorage.getItem(
      "isAdmin"
    ) === "true";

  const currentUserId =
    Number(
      sessionStorage.getItem(
        "userId"
      )
    );

  const [feedback, setFeedback] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const adminFetch = useCallback(
    async (
      path,
      options = {}
    ) => {
      const response = await fetch(
        `${API}${path}`,
        {
          ...options,
          headers: {
            Authorization:
              `Bearer ${adminToken}`,
            ...(options.body
              ? {
                  "Content-Type":
                    "application/json",
                }
              : {}),
          },
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

      return data;
    },
    [adminToken]
  );

  const loadFeedback =
    useCallback(async () => {
      if (
        !isAdmin ||
        !adminToken
      ) {
        setError(
          "Admin access is required. Please log in again."
        );

        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data =
          await adminFetch(
            "/admin/feedback"
          );

        setFeedback(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (loadError) {
        setError(
          loadError.message
        );
      } finally {
        setLoading(false);
      }
    }, [
      adminFetch,
      adminToken,
      isAdmin,
    ]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const suspendAccount =
    async (
      userId,
      label
    ) => {
      if (!userId) {
        return;
      }

      if (
        userId === currentUserId
      ) {
        setError(
          "You cannot suspend your own admin account."
        );
        return;
      }

      const enteredReason =
        window.prompt(
          `Why are you suspending ${label}?`
        );

      if (
        enteredReason === null
      ) {
        return;
      }

      const reason =
        enteredReason.trim();

      if (!reason) {
        setError(
          "A suspension reason is required."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Suspend ${label}?`
        );

      if (!confirmed) {
        return;
      }

      setBusy(
        `suspend-${userId}`
      );

      setError("");
      setMessage("");

      try {
        const data =
          await adminFetch(
            `/admin/users/${userId}/suspend`,
            {
              method: "POST",
              body: JSON.stringify({
                reason,
              }),
            }
          );

        setMessage(
          data.message ||
            `${label} was suspended.`
        );

        await loadFeedback();
      } catch (actionError) {
        setError(
          actionError.message
        );
      } finally {
        setBusy("");
      }
    };

  const reactivateAccount =
    async (
      userId,
      label
    ) => {
      if (!userId) {
        return;
      }

      const confirmed =
        window.confirm(
          `Reactivate ${label}?`
        );

      if (!confirmed) {
        return;
      }

      setBusy(
        `reactivate-${userId}`
      );

      setError("");
      setMessage("");

      try {
        const data =
          await adminFetch(
            `/admin/users/${userId}/reactivate`,
            {
              method: "POST",
            }
          );

        setMessage(
          data.message ||
            `${label} was reactivated.`
        );

        await loadFeedback();
      } catch (actionError) {
        setError(
          actionError.message
        );
      } finally {
        setBusy("");
      }
    };

  const accountButton = (
    userId,
    name,
    status,
    role
  ) => {
    if (!userId) {
      return null;
    }

    if (
      userId === currentUserId
    ) {
      return (
        <span className="admin-self-label">
          Your admin account
        </span>
      );
    }

    const label =
      `${role} ${name || ""}`
        .trim();

    const suspended =
      status === "SUSPENDED";

    return suspended ? (
      <button
        type="button"
        className="reactivate-button"
        disabled={Boolean(busy)}
        onClick={() =>
          reactivateAccount(
            userId,
            label
          )
        }
      >
        {busy ===
        `reactivate-${userId}`
          ? "Reactivating..."
          : `Reactivate ${role}`}
      </button>
    ) : (
      <button
        type="button"
        className="suspend-button"
        disabled={Boolean(busy)}
        onClick={() =>
          suspendAccount(
            userId,
            label
          )
        }
      >
        {busy ===
        `suspend-${userId}`
          ? "Suspending..."
          : `Suspend ${role}`}
      </button>
    );
  };

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "Unknown date";
    }

    return new Date(
      value
    ).toLocaleString();
  };

  if (
    !isAdmin ||
    !adminToken
  ) {
    return (
      <div className="admin-feedback-page">
        <div className="admin-access-card">
          <ShieldCheck size={45} />

          <h1>
            Admin access required
          </h1>

          <p>
            Log in again using your
            admin-enabled driver account.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/driver-phone"
              )
            }
          >
            Driver Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-feedback-page">
      <header className="admin-feedback-header">
        <button
          type="button"
          className="admin-back-button"
          onClick={() =>
            navigate(
              "/driver-dashboard"
            )
          }
        >
          <ArrowLeft size={20} />
          Driver Mode
        </button>

        <div>
          <h1>
            Admin Feedback
          </h1>

          <p>
            View feedback and manage
            related accounts.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={loadFeedback}
          disabled={loading}
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </header>

      {error && (
        <p className="admin-error">
          {error}
        </p>
      )}

      {message && (
        <p className="admin-success">
          {message}
        </p>
      )}

      {loading ? (
        <p className="admin-loading">
          Loading feedback...
        </p>
      ) : feedback.length === 0 ? (
        <div className="admin-empty-card">
          No feedback has been
          submitted yet.
        </div>
      ) : (
        <div className="feedback-list">
          {feedback.map(
            (item) => (
              <article
                key={
                  item.feedbackId
                }
                className="admin-feedback-card"
              >
                <div className="feedback-card-heading">
                  <div>
                    <span className="feedback-role-badge">
                      {item.submittedBy}
                    </span>

                    <h2>
                      Feedback #
                      {item.feedbackId}
                    </h2>
                  </div>

                  <div className="feedback-ride">
                    Ride #{item.rideId}
                    <span>
                      {item.rideStatus}
                    </span>
                  </div>
                </div>

                <div className="feedback-content">
                  <p>
                    <strong>
                      Rating:
                    </strong>{" "}
                    {item.rating
                      ? `${item.rating}/5`
                      : "No rating"}
                  </p>

                  <p>
                    <strong>
                      Category:
                    </strong>{" "}
                    {item.reportCategory ||
                      "None"}
                  </p>

                  <p>
                    <strong>
                      Comment:
                    </strong>{" "}
                    {item.comment ||
                      "No comment"}
                  </p>

                  <p className="feedback-date">
                    {formatDate(
                      item.createdAt
                    )}
                  </p>
                </div>

                <div className="feedback-accounts">
                  <section className="feedback-account">
                    <h3>
                      Passenger
                    </h3>

                    <p>
                      {item.passengerName ||
                        "Unknown passenger"}
                    </p>

                    <span
                      className={`account-status ${
                        item.passengerAccountStatus ===
                        "SUSPENDED"
                          ? "suspended"
                          : "active"
                      }`}
                    >
                      {item.passengerAccountStatus ||
                        "ACTIVE"}
                    </span>

                    {accountButton(
                      item.passengerUserId,
                      item.passengerName,
                      item.passengerAccountStatus,
                      "Passenger"
                    )}
                  </section>

                  <section className="feedback-account">
                    <h3>
                      Driver
                    </h3>

                    <p>
                      {item.driverName ||
                        "Unknown driver"}
                    </p>

                    <span
                      className={`account-status ${
                        item.driverAccountStatus ===
                        "SUSPENDED"
                          ? "suspended"
                          : "active"
                      }`}
                    >
                      {item.driverAccountStatus ||
                        "ACTIVE"}
                    </span>

                    {accountButton(
                      item.driverUserId,
                      item.driverName,
                      item.driverAccountStatus,
                      "Driver"
                    )}
                  </section>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default AdminFeedback;