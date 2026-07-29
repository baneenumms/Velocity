import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  AlertTriangle,
  ArrowLeft,
  CircleHelp,
  Menu,
  Wallet,
} from "lucide-react";

import HamburgerMenu from
  "../components/HamburgerMenu";

import "./DriverWallet.css";

const API =
  "http://localhost:8080";

function DriverWallet() {
  const navigate = useNavigate();

  const driverId = Number(
    sessionStorage.getItem(
      "driverId"
    )
  );

  const [wallet, setWallet] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const validDriver =
    Number.isInteger(driverId) &&
    driverId > 0;

  useEffect(() => {
    if (!validDriver) {
      setError(
        "No driver session found. Please log in again."
      );

      setLoading(false);
      return undefined;
    }

    let stopped = false;

    const fetchWallet = async () => {
      try {
        const response = await fetch(
          `${API}/drivers/${driverId}/wallet`
        );

        const text =
          await response.text();

        let data = null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              text ||
              "Unable to load wallet."
          );
        }

        if (!stopped) {
          setWallet(data);
          setError("");
        }
      } catch (walletError) {
        if (!stopped) {
          setError(
            walletError.message ||
              "Unable to connect to the server."
          );
        }
      } finally {
        if (!stopped) {
          setLoading(false);
        }
      }
    };

    fetchWallet();

    return () => {
      stopped = true;
    };
  }, [
    driverId,
    validDriver,
  ]);

  const formatMoney = (amount) =>
    Number(
      amount ?? 0
    ).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

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
    <div className="page wallet-page">
      <HamburgerMenu
        open={menuOpen}
        onClose={() =>
          setMenuOpen(false)
        }
      />

      <div className="dashboard-header">
        <button
          type="button"
          className="menu-btn"
          onClick={() =>
            setMenuOpen(true)
          }
          aria-label="Open menu"
        >
          <Menu size={25} />
        </button>

        <div className="velocity-title small">
          <span className="velo">
            VEL
          </span>

          <span className="wheel">
            <span className="hub" />
          </span>

          <span className="city">
            CITY
          </span>
        </div>
      </div>

      <div className="card wallet-card">
        <button
          type="button"
          className="wallet-help-button"
          onClick={() =>
            navigate(
              "/driver-wallet-info"
            )
          }
          aria-label="Learn how your wallet works"
          title="Learn how your wallet works"
        >
          <CircleHelp size={27} />
        </button>

        <div className="wallet-heading">
          <div className="icon-circle">
            <Wallet
              size={36}
              color="white"
            />
          </div>

          <h1 className="title">
            My Wallet
          </h1>

          <p className="subtitle">
            Your Velocity platform-fee
            balance.
          </p>
        </div>

        <div className="wallet-scroll">
          {loading && (
            <p className="subtitle">
              Loading wallet...
            </p>
          )}

          {!loading && error && (
            <p className="error">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            wallet && (
              <>
                <div className="balance-box">
                  <span className="balance-label">
                    Available Balance
                  </span>

                  <span className="balance-amount">
                    Rs{" "}
                    {formatMoney(
                      availableBalance
                    )}
                  </span>

                  <span className="balance-description">
                    Balance currently
                    available for platform
                    fees.
                  </span>
                </div>

                {availableBalance <=
                  0 && (
                  <div className="wallet-warning">
                    <AlertTriangle
                      size={20}
                    />

                    <span>
                      Your wallet balance
                      is low.
                    </span>
                  </div>
                )}

                <div className="wallet-section">
                  <h2 className="section-label">
                    Balance Details
                  </h2>

                  <div className="info-row">
                    <span className="info-label">
                      Total Balance
                    </span>

                    <span className="info-value">
                      Rs{" "}
                      {formatMoney(
                        totalBalance
                      )}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">
                      Reserved Fees
                    </span>

                    <span className="info-value reserved-value">
                      Rs{" "}
                      {formatMoney(
                        reservedBalance
                      )}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">
                      Available Balance
                    </span>

                    <span className="info-value available-value">
                      Rs{" "}
                      {formatMoney(
                        availableBalance
                      )}
                    </span>
                  </div>
                </div>

                <div className="wallet-section">
                  <h2 className="section-label">
                    Wallet Details
                  </h2>

                  <div className="info-row">
                    <span className="info-label">
                      Wallet ID
                    </span>

                    <span className="info-value">
                      {wallet.walletId ??
                        "—"}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">
                      Driver ID
                    </span>

                    <span className="info-value">
                      {wallet.driverId ??
                        driverId}
                    </span>
                  </div>
                </div>
              </>
            )}
        </div>

        <button
          type="button"
          className="primary-btn back-btn"
          onClick={() =>
            navigate(
              "/driver-dashboard"
            )
          }
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default DriverWallet;