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
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Clock3,
  Menu,
  PlusCircle,
  RefreshCw,
  Wallet,
  XCircle,
} from "lucide-react";

import HamburgerMenu from
  "../components/HamburgerMenu";
import VelocityMark from "../components/VelocityMark";

import "./DriverWallet.css";

const API =
  apiBaseUrl;

const getToday = () => {
  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createEmptyForm = (
  paymentMethodCode = ""
) => ({
  amount: "",
  paymentMethodCode,
  referenceNumber: "",
  paymentDate: getToday(),
  note: "",
});

function DriverWallet() {
  const navigate = useNavigate();

  const storedDriverId =
    sessionStorage.getItem(
      "driverId"
    ) ||
    localStorage.getItem(
      "driverId"
    );

  const driverId =
    Number(storedDriverId);

  const validDriver =
    Number.isInteger(driverId) &&
    driverId > 0;

  const [wallet, setWallet] =
    useState(null);

  const [
    paymentMethods,
    setPaymentMethods,
  ] = useState([]);

  const [
    topUpRequests,
    setTopUpRequests,
  ] = useState([]);

  const [form, setForm] =
    useState(
      createEmptyForm()
    );

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    topUpOpen,
    setTopUpOpen,
  ] = useState(false);

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

  const responseError = (
    response,
    data,
    fallback
  ) => {
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

    if (response.status === 404) {
      return "Driver wallet was not found.";
    }

    if (response.status === 409) {
      return "This payment reference number has already been submitted.";
    }

    if (response.status === 400) {
      return "Please check the top-up information and try again.";
    }

    return fallback;
  };

  const loadWalletData =
    useCallback(
      async (
        showFullLoading = true
      ) => {
        if (!validDriver) {
          setError(
            "No driver session found. Please log in again."
          );

          setLoading(false);
          return;
        }

        if (showFullLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        try {
          const [
            walletResponse,
            methodsResponse,
            requestsResponse,
          ] = await Promise.all([
            fetch(
              `${API}/driver-wallet/${driverId}`
            ),

            fetch(
              `${API}/driver-wallet/payment-methods`
            ),

            fetch(
              `${API}/driver-wallet/${driverId}/top-ups`
            ),
          ]);

          const [
            walletData,
            methodsData,
            requestsData,
          ] = await Promise.all([
            readResponse(
              walletResponse
            ),

            readResponse(
              methodsResponse
            ),

            readResponse(
              requestsResponse
            ),
          ]);

          if (!walletResponse.ok) {
            throw new Error(
              responseError(
                walletResponse,
                walletData,
                "Unable to load wallet."
              )
            );
          }

          if (!methodsResponse.ok) {
            throw new Error(
              responseError(
                methodsResponse,
                methodsData,
                "Unable to load payment methods."
              )
            );
          }

          if (!requestsResponse.ok) {
            throw new Error(
              responseError(
                requestsResponse,
                requestsData,
                "Unable to load top-up history."
              )
            );
          }

          const methods =
            Array.isArray(methodsData)
              ? methodsData
              : [];

          setWallet(walletData);

          setPaymentMethods(
            methods
          );

          setTopUpRequests(
            Array.isArray(
              requestsData
            )
              ? requestsData
              : []
          );

          setForm(
            (current) => ({
              ...current,

              paymentMethodCode:
                current
                  .paymentMethodCode ||
                methods[0]
                  ?.paymentMethodCode ||
                "",
            })
          );
        } catch (requestError) {
          console.error(
            requestError
          );

          setError(
            requestError.message ||
              "Unable to connect to the wallet server."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        driverId,
        validDriver,
      ]
    );

  useEffect(() => {
    loadWalletData(true);
  }, [loadWalletData]);

  const updateForm = (
    field,
    value
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setFormError("");
  };

  const validateForm = () => {
    const amountText =
      form.amount.trim();

    if (
      !/^\d+(\.\d{1,2})?$/.test(
        amountText
      )
    ) {
      return "Enter a valid amount with no more than two decimal places.";
    }

    const amount =
      Number(amountText);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return "Top-up amount must be greater than zero.";
    }

    if (
      !form.paymentMethodCode
    ) {
      return "Select a payment method.";
    }

    if (
      !form.referenceNumber.trim()
    ) {
      return "Enter the payment reference number.";
    }

    if (
      form.referenceNumber
        .trim().length > 100
    ) {
      return "Payment reference number cannot exceed 100 characters.";
    }

    if (!form.paymentDate) {
      return "Select the payment date.";
    }

    if (
      form.paymentDate >
      getToday()
    ) {
      return "Payment date cannot be in the future.";
    }

    if (
      form.note.trim().length >
      500
    ) {
      return "Note cannot exceed 500 characters.";
    }

    return "";
  };

  const submitTopUp =
    async (event) => {
      event.preventDefault();

      const validationError =
        validateForm();

      if (validationError) {
        setFormError(
          validationError
        );

        return;
      }

      setSubmitting(true);
      setFormError("");

      try {
        const response =
          await fetch(
            `${API}/driver-wallet/${driverId}/top-ups`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                amount:
                  Number(
                    form.amount
                  ),

                paymentMethodCode:
                  form.paymentMethodCode,

                referenceNumber:
                  form.referenceNumber
                    .trim(),

                paymentDate:
                  form.paymentDate,

                note:
                  form.note.trim() ||
                  null,
              }),
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            responseError(
              response,
              data,
              "Unable to submit the top-up request."
            )
          );
        }

        const firstMethod =
          paymentMethods[0]
            ?.paymentMethodCode ||
          "";

        setForm(
          createEmptyForm(
            firstMethod
          )
        );

        setTopUpOpen(false);

        setActionMessage({
          title:
            data.autoApproved
              ? "Wallet Topped Up"
              : "Top-Up Submitted",

          message:
            data.message ||
            (
              data.autoApproved
                ? "The amount has been added to your wallet successfully."
                : "Your request has been submitted for admin approval."
            ),
        });

        await loadWalletData(
          false
        );
      } catch (requestError) {
        console.error(
          requestError
        );

        setFormError(
          requestError.message ||
            "Unable to submit the top-up request."
        );
      } finally {
        setSubmitting(false);
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

  const totalBalance =
    Number(
      wallet?.balance ?? 0
    );

  const reservedBalance =
    Number(
      wallet?.reservedBalance ??
        0
    );

  const availableBalance =
    wallet?.availableBalance !==
    undefined
      ? Number(
          wallet.availableBalance
        )
      : totalBalance -
        reservedBalance;

  return (
    <div className="driver-wallet-shell">
      <HamburgerMenu
        open={menuOpen}
        onClose={() =>
          setMenuOpen(false)
        }
      />

      {actionMessage && (
        <div
          className="wallet-message-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-message-title"
        >
          <div className="wallet-message-card">
            <div className="wallet-message-icon">
              <CheckCircle2
                size={44}
              />
            </div>

            <h2 id="wallet-message-title">
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

      <main className="wallet-page">
        <header className="wallet-header">
          <button
            type="button"
            className="wallet-menu-button"
            onClick={() =>
              setMenuOpen(true)
            }
            aria-label="Open menu"
          >
            <Menu size={25} />
          </button>

          <VelocityMark className="driver-header-mark" />

          <button
            type="button"
            className="wallet-refresh-button"
            onClick={() =>
              loadWalletData(
                false
              )
            }
            disabled={
              loading ||
              refreshing
            }
            aria-label="Refresh wallet"
            title="Refresh wallet"
          >
            <RefreshCw
              size={21}
              className={
                refreshing
                  ? "spinning"
                  : ""
              }
            />
          </button>
        </header>

        <div className="wallet-container">
          <section className="wallet-title-row">
            <div>
              <span className="wallet-eyebrow">
                Driver finances
              </span>

              <h1>My Wallet</h1>

              <p>
                Manage your balance,
                platform-fee reservations,
                and top-up requests.
              </p>
            </div>

            <button
              type="button"
              className="wallet-help-button"
              onClick={() =>
                navigate(
                  "/driver-wallet-info"
                )
              }
            >
              <CircleHelp
                size={20}
              />

              How it works
            </button>
          </section>

          {loading && (
            <div className="wallet-loading-card">
              Loading your wallet...
            </div>
          )}

          {!loading && error && (
            <div className="wallet-error-card">
              <AlertTriangle
                size={22}
              />

              <div>
                <strong>
                  Wallet unavailable
                </strong>

                <p>{error}</p>
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            wallet && (
              <>
                <section className="wallet-overview-grid">
                  <div className="wallet-balance-card">
                    <div className="wallet-balance-icon">
                      <Wallet
                        size={30}
                      />
                    </div>

                    <span className="wallet-balance-label">
                      Available Balance
                    </span>

                    <strong className="wallet-balance-amount">
                      Rs{" "}
                      {formatMoney(
                        availableBalance
                      )}
                    </strong>

                    <p>
                      This amount is
                      currently available
                      for platform fees.
                    </p>

                    <button
                      type="button"
                      className="wallet-top-up-button"
                      onClick={() =>
                        setTopUpOpen(
                          (open) =>
                            !open
                        )
                      }
                      aria-expanded={
                        topUpOpen
                      }
                    >
                      <PlusCircle
                        size={20}
                      />

                      Top Up My Wallet

                      {topUpOpen ? (
                        <ChevronUp
                          size={18}
                        />
                      ) : (
                        <ChevronDown
                          size={18}
                        />
                      )}
                    </button>
                  </div>

                  <div className="wallet-summary-card">
                    <div className="wallet-summary-heading">
                      <h2>
                        Balance Details
                      </h2>

                      <span>
                        Wallet #
                        {wallet.walletId}
                      </span>
                    </div>

                    <div className="wallet-summary-row">
                      <span>
                        Total Balance
                      </span>

                      <strong>
                        Rs{" "}
                        {formatMoney(
                          totalBalance
                        )}
                      </strong>
                    </div>

                    <div className="wallet-summary-row">
                      <span>
                        Reserved Fees
                      </span>

                      <strong className="reserved">
                        Rs{" "}
                        {formatMoney(
                          reservedBalance
                        )}
                      </strong>
                    </div>

                    <div className="wallet-summary-row">
                      <span>
                        Available Balance
                      </span>

                      <strong className="available">
                        Rs{" "}
                        {formatMoney(
                          availableBalance
                        )}
                      </strong>
                    </div>

                    <div className="wallet-summary-row">
                      <span>
                        Driver ID
                      </span>

                      <strong>
                        {wallet.driverId ??
                          driverId}
                      </strong>
                    </div>
                  </div>
                </section>

                {availableBalance <=
                  0 && (
                  <div className="wallet-low-balance">
                    <AlertTriangle
                      size={21}
                    />

                    <div>
                      <strong>
                        Your wallet needs
                        a top-up
                      </strong>

                      <p>
                        Add funds before
                        accepting a ride
                        that requires a
                        platform-fee
                        reservation.
                      </p>
                    </div>
                  </div>
                )}

                {topUpOpen && (
                  <section className="wallet-top-up-card">
                    <div className="wallet-section-heading">
                      <div>
                        <span>
                          Add funds
                        </span>

                        <h2>
                          Top Up My Wallet
                        </h2>

                        <p>
                          Submit the
                          payment details
                          used to fund this
                          wallet.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="wallet-form-close"
                        onClick={() =>
                          setTopUpOpen(
                            false
                          )
                        }
                        aria-label="Close top-up form"
                      >
                        <XCircle
                          size={23}
                        />
                      </button>
                    </div>

                    <form
                      onSubmit={
                        submitTopUp
                      }
                    >
                      <div className="wallet-form-grid">
                        <label className="wallet-form-field">
                          <span>
                            Amount (Rs)
                          </span>

                          <input
                            type="number"
                            min="0.01"
                            max="99999999.99"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="500.00"
                            value={
                              form.amount
                            }
                            onChange={(
                              event
                            ) =>
                              updateForm(
                                "amount",
                                event.target
                                  .value
                              )
                            }
                            disabled={
                              submitting
                            }
                          />
                        </label>

                        <label className="wallet-form-field">
                          <span>
                            Payment Method
                          </span>

                          <select
                            value={
                              form.paymentMethodCode
                            }
                            onChange={(
                              event
                            ) =>
                              updateForm(
                                "paymentMethodCode",
                                event.target
                                  .value
                              )
                            }
                            disabled={
                              submitting
                            }
                          >
                            <option value="">
                              Select payment
                              method
                            </option>

                            {paymentMethods.map(
                              (
                                method
                              ) => (
                                <option
                                  key={
                                    method.paymentMethodCode
                                  }
                                  value={
                                    method.paymentMethodCode
                                  }
                                >
                                  {
                                    method.displayName
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </label>

                        <label className="wallet-form-field">
                          <span>
                            Payment Reference
                          </span>

                          <input
                            type="text"
                            maxLength={100}
                            placeholder="Transaction or receipt reference"
                            value={
                              form.referenceNumber
                            }
                            onChange={(
                              event
                            ) =>
                              updateForm(
                                "referenceNumber",
                                event.target
                                  .value
                              )
                            }
                            disabled={
                              submitting
                            }
                          />
                        </label>

                        <label className="wallet-form-field">
                          <span>
                            Payment Date
                          </span>

                          <input
                            type="date"
                            max={getToday()}
                            value={
                              form.paymentDate
                            }
                            onChange={(
                              event
                            ) =>
                              updateForm(
                                "paymentDate",
                                event.target
                                  .value
                              )
                            }
                            disabled={
                              submitting
                            }
                          />
                        </label>

                        <label className="wallet-form-field wallet-form-field-full">
                          <span>
                            Note{" "}
                            <small>
                              Optional
                            </small>
                          </span>

                          <textarea
                            rows="3"
                            maxLength={500}
                            placeholder="Any additional payment details"
                            value={
                              form.note
                            }
                            onChange={(
                              event
                            ) =>
                              updateForm(
                                "note",
                                event.target
                                  .value
                              )
                            }
                            disabled={
                              submitting
                            }
                          />
                        </label>
                      </div>

                      <div className="wallet-review-note">
                        <Clock3
                          size={19}
                        />

                        <p>
                          Normal driver
                          top-ups require
                          admin approval.
                          Admin-driver
                          top-ups are
                          recorded and
                          approved
                          automatically.
                        </p>
                      </div>

                      {formError && (
                        <div className="wallet-form-error">
                          <AlertTriangle
                            size={19}
                          />

                          <span>
                            {formError}
                          </span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="wallet-submit-button"
                        disabled={
                          submitting
                        }
                      >
                        {submitting
                          ? "Submitting Top-Up..."
                          : "Submit Top-Up"}
                      </button>
                    </form>
                  </section>
                )}

                <section className="wallet-history-card">
                  <div className="wallet-section-heading">
                    <div>
                      <span>
                        Activity
                      </span>

                      <h2>
                        Top-Up History
                      </h2>

                      <p>
                        Review submitted,
                        approved, and
                        rejected requests.
                      </p>
                    </div>
                  </div>

                  {topUpRequests.length ===
                  0 ? (
                    <div className="wallet-empty-history">
                      <Wallet
                        size={30}
                      />

                      <strong>
                        No top-ups yet
                      </strong>

                      <p>
                        Your first request
                        will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="wallet-history-list">
                      {topUpRequests.map(
                        (request) => {
                          const status =
                            (
                              request.requestStatus ||
                              "PENDING"
                            ).toLowerCase();

                          return (
                            <article
                              className="wallet-history-item"
                              key={
                                request.topUpRequestId
                              }
                            >
                              <div className="wallet-history-main">
                                <div>
                                  <strong className="wallet-history-amount">
                                    Rs{" "}
                                    {formatMoney(
                                      request.amount
                                    )}
                                  </strong>

                                  <p>
                                    {
                                      request.paymentMethodName
                                    }
                                    {" · "}
                                    {
                                      request.referenceNumber
                                    }
                                  </p>
                                </div>

                                <span
                                  className={
                                    `wallet-request-status ${status}`
                                  }
                                >
                                  {
                                    request.requestStatus
                                  }
                                </span>
                              </div>

                              <div className="wallet-history-meta">
                                <span>
                                  Paid:{" "}
                                  {formatDate(
                                    request.paymentDate
                                  )}
                                </span>

                                <span>
                                  Submitted:{" "}
                                  {formatDateTime(
                                    request.submittedAt
                                  )}
                                </span>

                                {request.transactionId && (
                                  <span>
                                    Transaction #
                                    {
                                      request.transactionId
                                    }
                                  </span>
                                )}
                              </div>

                              {request.note && (
                                <p className="wallet-history-note">
                                  {
                                    request.note
                                  }
                                </p>
                              )}

                              {request.rejectionReason && (
                                <div className="wallet-rejection-reason">
                                  <XCircle
                                    size={18}
                                  />

                                  <span>
                                    {
                                      request.rejectionReason
                                    }
                                  </span>
                                </div>
                              )}
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
                </section>
              </>
            )}

          <button
            type="button"
            className="wallet-back-button"
            onClick={() =>
              navigate(
                "/driver-dashboard"
              )
            }
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

export default DriverWallet;
