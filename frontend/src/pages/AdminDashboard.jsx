import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  ClipboardCheck,
  MessageSquareText,
  UserRoundCog,
  WalletCards,
} from "lucide-react";

import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const isAdmin =
    sessionStorage.getItem("isAdmin") === "true" ||
    localStorage.getItem("isAdmin") === "true";

  const adminToken =
    sessionStorage.getItem("adminToken") ||
    localStorage.getItem("adminToken");

  useEffect(() => {
    if (!isAdmin || !adminToken) {
      navigate(
        "/driver-dashboard",
        {
          replace: true,
        }
      );
    }
  }, [
    adminToken,
    isAdmin,
    navigate,
  ]);

  if (!isAdmin || !adminToken) {
    return null;
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        <header className="admin-dashboard-heading">
          <span className="admin-page-eyebrow">
            Control centre
          </span>

          <h1>
            Admin Dashboard
          </h1>

          <p>
            Review applications,
            financial requests,
            feedback and account
            actions.
          </p>
        </header>

        <section className="admin-dashboard-grid">
          <article className="admin-dashboard-card">
            <div className="admin-dashboard-card-icon">
              <ClipboardCheck
                size={30}
              />
            </div>

            <h2>
              Driver Applications
            </h2>

            <p>
              Review pending driver
              information, approve valid
              applications or provide
              field-level correction
              instructions.
            </p>

            <button
              onClick={() =>
                navigate(
                  "/admin/applications"
                )
              }
            >
              Review Applications
            </button>
          </article>

          <article className="admin-dashboard-card">
            <div className="admin-dashboard-card-icon">
              <WalletCards
                size={30}
              />
            </div>

            <h2>
              Wallet Top-ups
            </h2>

            <p>
              Review externally paid
              driver top-up requests,
              approve wallet credits
              exactly once, or reject
              invalid submissions.
            </p>

            <button
              onClick={() =>
                navigate(
                  "/admin/wallet-top-ups"
                )
              }
            >
              Review Wallet Top-ups
            </button>
          </article>

          <article className="admin-dashboard-card">
            <div className="admin-dashboard-card-icon">
              <MessageSquareText
                size={30}
              />
            </div>

            <h2>Feedback</h2>

            <p>
              View feedback submitted
              by passengers and drivers
              and manage related
              accounts.
            </p>

            <button
              onClick={() =>
                navigate(
                  "/admin/feedback"
                )
              }
            >
              View Feedback
            </button>
          </article>

          <article className="admin-dashboard-card">
            <div className="admin-dashboard-card-icon">
              <UserRoundCog
                size={30}
              />
            </div>

            <h2>
              Account Management
            </h2>

            <p>
              View suspended accounts,
              suspension reasons and
              future reactivation
              actions in one place.
            </p>

            <span className="admin-dashboard-coming">
              Current suspension controls
              remain available inside
              Feedback and Applications.
            </span>

            <button disabled>
              Separate Account List
              Coming Later
            </button>
          </article>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;