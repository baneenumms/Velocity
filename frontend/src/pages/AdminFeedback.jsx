import { apiBaseUrl } from "../config/api.js";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import "./AdminFeedback.css";

const API =
  apiBaseUrl;

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
    ) ||
    localStorage.getItem(
      "adminToken"
    );

  const isAdmin =
    sessionStorage.getItem(
      "isAdmin"
    ) === "true" ||
    localStorage.getItem(
      "isAdmin"
    ) === "true";

  const currentUserId =
    Number(
      sessionStorage.getItem(
        "userId"
      ) ||
      localStorage.getItem(
        "userId"
      )
    );

  const [feedback, setFeedback] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message] =
    useState(() => {
      const notice =
        sessionStorage.getItem(
          "velocityAdminNotice"
        );

      sessionStorage.removeItem(
        "velocityAdminNotice"
      );

      return notice || "";
    });

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

  const openAccountAction = (
    action,
    userId,
    name,
    role,
    feedbackId,
    rideId
  ) => {
    if (!userId) {
      return;
    }

    if (
      action === "SUSPEND" &&
      userId === currentUserId
    ) {
      setError(
        "You cannot suspend your own admin account."
      );
      return;
    }

    const context = {
      action,
      userId,
      name: name || "Unknown account",
      role,
      feedbackId,
      rideId,
    };

    sessionStorage.setItem(
      "velocityAdminActionContext",
      JSON.stringify(context)
    );

    navigate(
      "/admin/account-action",
      {
        state: context,
      }
    );
  };

  const accountButton = (
    userId,
    name,
    status,
    role,
    feedbackId,
    rideId
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

    const suspended =
      status === "SUSPENDED";

    return suspended ? (
      <button
        type="button"
        className="reactivate-button"
        onClick={() =>
          openAccountAction(
            "REACTIVATE",
            userId,
            name,
            role,
            feedbackId,
            rideId
          )
        }
      >
        Reactivate {role}
      </button>
    ) : (
      <button
        type="button"
        className="suspend-button"
        onClick={() =>
          openAccountAction(
            "SUSPEND",
            userId,
            name,
            role,
            feedbackId,
            rideId
          )
        }
      >
        Suspend {role}
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
      <header className="admin-page-heading-row admin-feedback-header">
        <div>
          <span className="admin-page-eyebrow">
            Trust and safety
          </span>

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
          className="admin-page-refresh-button admin-refresh-button"
          onClick={loadFeedback}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={
              loading
                ? "spinning"
                : ""
            }
          />
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
                      "Passenger",
                      item.feedbackId,
                      item.rideId
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
                      "Driver",
                      item.feedbackId,
                      item.rideId
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