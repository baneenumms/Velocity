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
  CheckCircle2,
  Clock3,
  RefreshCw,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import "./AdminWalletTopUps.css";

const API =
  "http://localhost:8080";

const FILTERS = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ALL",
];

function AdminWalletTopUps() {
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

  const [
    filter,
    setFilter,
  ] = useState("PENDING");

  const [
    requests,
    setRequests,
  ] = useState([]);

  const [
    selected,
    setSelected,
  ] = useState(null);

  const [
    rejectionOpen,
    setRejectionOpen,
  ] = useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    actionMessage,
    setActionMessage,
  ] = useState(null);

  const readResponse =
    async (response) => {
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
    };

  const getErrorMessage = (
    response,
    data,
    fallback
  ) => {
    if (response.status === 401) {
      return "Admin session expired. Log out and sign in again.";
    }

    if (response.status === 403) {
      return "Admin access is required.";
    }

    if (response.status === 409) {
      return "This top-up request has already been reviewed.";
    }

    const message =
      data?.message ||
      data?.details ||
      data?.error;

    if (
      typeof message === "string" &&
      message.length <= 350
    ) {
      return message;
    }

    return fallback;
  };

  const loadRequests =
    useCallback(
      async (
        requestedFilter = filter
      ) => {
        if (!isAdmin || !adminToken) {
          navigate(
            "/driver-dashboard",
            {
              replace: true,
            }
          );

          return;
        }

        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              `${API}/admin/wallet-top-ups?status=${requestedFilter}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${adminToken}`,
                },
              }
            );

          const data =
            await readResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              getErrorMessage(
                response,
                data,
                "Unable to load wallet top-up requests."
              )
            );
          }

          setRequests(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (requestError) {
          console.error(
            requestError
          );

          setError(
            requestError.message ||
              "Unable to connect to the admin server."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        adminToken,
        filter,
        isAdmin,
        navigate,
      ]
    );

  useEffect(() => {
    loadRequests(filter);
  }, [
    filter,
    loadRequests,
  ]);

  const openRequest = (
    request
  ) => {
    setSelected(request);
    setRejectionOpen(false);
    setRejectionReason("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeRequest = () => {
    setSelected(null);
    setRejectionOpen(false);
    setRejectionReason("");
    setError("");
  };

  const approveRequest =
    async () => {
      if (
        !selected ||
        selected.requestStatus !==
          "PENDING"
      ) {
        return;
      }

      setActionLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API}/admin/wallet-top-ups/${selected.topUpRequestId}/approve`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${adminToken}`,
              },
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              response,
              data,
              "Unable to approve the top-up request."
            )
          );
        }

        setSelected(null);
        setRejectionOpen(false);

        setActionMessage({
          title:
            "Top-Up Approved",

          message:
            data.message ||
            "The driver's wallet was credited successfully.",
        });

        await loadRequests(
          filter
        );
      } catch (requestError) {
        console.error(
          requestError
        );

        setError(
          requestError.message ||
            "Unable to approve the top-up request."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const rejectRequest =
    async () => {
      const reason =
        rejectionReason.trim();

      if (!reason) {
        setError(
          "Enter a reason before rejecting this request."
        );

        return;
      }

      if (reason.length > 500) {
        setError(
          "Rejection reason cannot exceed 500 characters."
        );

        return;
      }

      setActionLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API}/admin/wallet-top-ups/${selected.topUpRequestId}/reject`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${adminToken}`,
              },

              body: JSON.stringify({
                rejectionReason:
                  reason,
              }),
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              response,
              data,
              "Unable to reject the top-up request."
            )
          );
        }

        setSelected(null);
        setRejectionOpen(false);
        setRejectionReason("");

        setActionMessage({
          title:
            "Top-Up Rejected",

          message:
            data.message ||
            "The request was rejected without changing the wallet balance.",
        });

        await loadRequests(
          filter
        );
      } catch (requestError) {
        console.error(
          requestError
        );

        setError(
          requestError.message ||
            "Unable to reject the top-up request."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const formatMoney = (
    amount
  ) =>
    Number(
      amount ?? 0
    ).toLocaleString(
      "en-PK",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "Not available";
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      "en-PK",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return "Not available";
    }

    return new Date(
      value
    ).toLocaleString(
      "en-PK",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const displayStatus = (
    value
  ) =>
    (value || "")
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );

  if (!isAdmin || !adminToken) {
    return null;
  }

  return (
    <div className="admin-topups-page">
      {actionMessage && (
        <div
          className="admin-topup-message-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-topup-message-title"
        >
          <div className="admin-topup-message-card">
            <div className="admin-topup-message-icon">
              <CheckCircle2
                size={44}
              />
            </div>

            <h2 id="admin-topup-message-title">
              {actionMessage.title}
            </h2>

            <p>
              {actionMessage.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setActionMessage(
                  null
                )
              }
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="admin-topups-container">
        <div className="admin-topups-topbar">
          <button
            type="button"
            onClick={() =>
              navigate("/admin")
            }
          >
            <ArrowLeft size={18} />
            Admin Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              loadRequests(filter)
            }
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
        </div>

        <header className="admin-topups-heading">
          <div className="admin-topups-heading-icon">
            <WalletCards
              size={32}
            />
          </div>

          <div>
            <h1>
              Wallet Top-Ups
            </h1>

            <p>
              Review external payment
              details before crediting
              driver wallets.
            </p>
          </div>
        </header>

        <div className="admin-topup-tabs">
          {FILTERS.map(
            (value) => (
              <button
                type="button"
                key={value}
                className={
                  filter === value
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setFilter(value);
                  setSelected(null);
                  setRejectionOpen(
                    false
                  );
                  setError("");
                }}
              >
                {displayStatus(value)}
              </button>
            )
          )}
        </div>

        {error && (
          <div className="admin-topups-error">
            {error}
          </div>
        )}

        {selected && (
          <section className="admin-topup-detail">
            <div className="admin-topup-detail-header">
              <div>
                <span>
                  Top-up request
                </span>

                <h2>
                  Request #
                  {
                    selected.topUpRequestId
                  }
                </h2>
              </div>

              <button
                type="button"
                className="admin-topup-close"
                onClick={
                  closeRequest
                }
                aria-label="Close request"
              >
                <X size={21} />
              </button>
            </div>

            <div className="admin-topup-detail-grid">
              <DetailField
                label="Driver"
                value={
                  selected.driverName
                }
              />

              <DetailField
                label="Driver ID"
                value={
                  selected.driverId
                }
              />

              <DetailField
                label="Phone"
                value={
                  selected.phoneNumber
                }
              />

              <DetailField
                label="Email"
                value={
                  selected.email
                }
              />

              <DetailField
                label="Amount"
                value={
                  `Rs ${formatMoney(
                    selected.amount
                  )}`
                }
              />

              <DetailField
                label="Current Balance"
                value={
                  `Rs ${formatMoney(
                    selected.currentBalance
                  )}`
                }
              />

              <DetailField
                label="Payment Method"
                value={
                  selected.paymentMethodName
                }
              />

              <DetailField
                label="Reference Number"
                value={
                  selected.referenceNumber
                }
              />

              <DetailField
                label="Payment Date"
                value={
                  formatDate(
                    selected.paymentDate
                  )
                }
              />

              <DetailField
                label="Submitted"
                value={
                  formatDateTime(
                    selected.submittedAt
                  )
                }
              />

              <DetailField
                label="Status"
                value={
                  displayStatus(
                    selected.requestStatus
                  )
                }
              />

              <DetailField
                label="Transaction ID"
                value={
                  selected.transactionId
                    ? `#${selected.transactionId}`
                    : "Not created"
                }
              />
            </div>

            {selected.note && (
              <div className="admin-topup-note">
                <strong>
                  Driver Note
                </strong>

                <p>
                  {selected.note}
                </p>
              </div>
            )}

            {selected.rejectionReason && (
              <div className="admin-topup-rejection-record">
                <strong>
                  Rejection Reason
                </strong>

                <p>
                  {
                    selected.rejectionReason
                  }
                </p>
              </div>
            )}

            {selected.requestStatus ===
              "PENDING" && (
              <>
                <div className="admin-topup-warning">
                  <Clock3 size={20} />

                  <p>
                    Approval immediately
                    creates a credit
                    transaction and adds
                    Rs{" "}
                    {formatMoney(
                      selected.amount
                    )}{" "}
                    to this wallet.
                  </p>
                </div>

                <div className="admin-topup-actions">
                  <button
                    type="button"
                    className="admin-topup-approve"
                    onClick={
                      approveRequest
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Approve and Credit Wallet"}
                  </button>

                  <button
                    type="button"
                    className="admin-topup-reject"
                    onClick={() => {
                      setRejectionOpen(
                        (open) =>
                          !open
                      );
                      setError("");
                    }}
                    disabled={
                      actionLoading
                    }
                  >
                    Reject Request
                  </button>
                </div>

                {rejectionOpen && (
                  <div className="admin-topup-reject-form">
                    <label>
                      Rejection reason
                    </label>

                    <textarea
                      rows="4"
                      maxLength={500}
                      placeholder="Explain why this payment could not be approved"
                      value={
                        rejectionReason
                      }
                      onChange={(
                        event
                      ) => {
                        setRejectionReason(
                          event.target
                            .value
                        );
                        setError("");
                      }}
                    />

                    <button
                      type="button"
                      onClick={
                        rejectRequest
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      <XCircle
                        size={18}
                      />

                      {actionLoading
                        ? "Rejecting..."
                        : "Confirm Rejection"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {loading ? (
          <div className="admin-topups-loading">
            Loading wallet top-ups...
          </div>
        ) : requests.length ===
          0 ? (
          <div className="admin-topups-empty">
            No top-up requests found
            in this category.
          </div>
        ) : (
          <section className="admin-topup-list">
            {requests.map(
              (request) => (
                <article
                  className="admin-topup-card"
                  key={
                    request.topUpRequestId
                  }
                >
                  <div className="admin-topup-card-header">
                    <div>
                      <h2>
                        {
                          request.driverName
                        }
                      </h2>

                      <p>
                        Request #
                        {
                          request.topUpRequestId
                        }
                        {" · "}
                        Driver #
                        {
                          request.driverId
                        }
                      </p>
                    </div>

                    <span
                      className={
                        `admin-topup-status ${
                          (
                            request.requestStatus ||
                            ""
                          ).toLowerCase()
                        }`
                      }
                    >
                      {
                        displayStatus(
                          request.requestStatus
                        )
                      }
                    </span>
                  </div>

                  <strong className="admin-topup-card-amount">
                    Rs{" "}
                    {formatMoney(
                      request.amount
                    )}
                  </strong>

                  <div className="admin-topup-card-meta">
                    <span>
                      <strong>
                        Method:
                      </strong>{" "}
                      {
                        request.paymentMethodName
                      }
                    </span>

                    <span>
                      <strong>
                        Reference:
                      </strong>{" "}
                      {
                        request.referenceNumber
                      }
                    </span>

                    <span>
                      <strong>
                        Paid:
                      </strong>{" "}
                      {formatDate(
                        request.paymentDate
                      )}
                    </span>

                    <span>
                      <strong>
                        Submitted:
                      </strong>{" "}
                      {formatDateTime(
                        request.submittedAt
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="admin-topup-review-button"
                    onClick={() =>
                      openRequest(
                        request
                      )
                    }
                  >
                    {request.requestStatus ===
                    "PENDING"
                      ? "Review Request"
                      : "View Details"}
                  </button>
                </article>
              )
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
}) {
  return (
    <div className="admin-topup-detail-field">
      <span>{label}</span>

      <strong>
        {value === null ||
        value === undefined ||
        value === ""
          ? "Not provided"
          : value}
      </strong>
    </div>
  );
}

export default AdminWalletTopUps;