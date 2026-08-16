import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  History,
  RotateCcw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import "./DriverWalletInfo.css";

const walletTopics = [
  {
    icon: CreditCard,
    title: "Passenger payments",
    content:
      "Passengers pay drivers directly using the selected cash or external digital-transfer method. Velocity records the payment preference but does not hold the passenger's ride payment in the driver wallet.",
  },
  {
    icon: WalletCards,
    title: "Total, reserved, and available balance",
    content:
      "Total balance is the wallet amount recorded for your account. Reserved fees are temporarily committed to accepted rides. Available balance is what remains for new platform-fee reservations.",
  },
  {
    icon: CircleDollarSign,
    title: "The 12% platform-fee reservation",
    content:
      "When a passenger accepts your offer, Velocity temporarily reserves 12% of the agreed fare. You may be unable to accept another ride when your available balance cannot cover its required reservation.",
    example: true,
  },
  {
    icon: Clock3,
    title: "When the platform fee is charged",
    content:
      "After the accepted ride begins, the platform fee becomes payable according to the trip schedule managed by Velocity. The reserved amount is then permanently deducted instead of returning to available balance.",
  },
  {
    icon: RotateCcw,
    title: "Cancellations before the ride starts",
    content:
      "If the passenger cancels, the 12% reservation is released. If you cancel a pending offer before acceptance, no fee applies. If you cancel an accepted ride before it starts, the reservation is released and 5% of the agreed fare is deducted from your wallet.",
  },
  {
    icon: History,
    title: "Trip and top-up records",
    content:
      "Trip History shows fare, platform fee, and net earnings. Wallet history shows submitted, approved, and rejected top-up requests. Normal driver top-ups only change the wallet after the applicable review succeeds.",
  },
];

function DriverWalletInfo() {
  const navigate = useNavigate();

  return (
    <div className="driver-wallet-info-page">
      <main className="driver-wallet-info-content">
        <section className="driver-wallet-info-title">
          <div>
            <p>Driver finances</p>
            <h1>How the Wallet Works</h1>
          </div>
          <button type="button" onClick={() => navigate("/driver-wallet")}>
            Return to My Wallet
          </button>
        </section>

        <section className="driver-wallet-info-intro">
          <div className="driver-wallet-info-intro-icon" aria-hidden="true">
            <ShieldCheck size={28} />
          </div>
          <div>
            <span>Velocity fee wallet</span>
            <h2>Your ride payment and platform-fee balance are separate</h2>
            <p>
              This wallet is used for Velocity platform fees and reservations. It is
              not where passengers send the fare for their ride.
            </p>
          </div>
        </section>

        <section className="driver-wallet-topic-list" aria-label="Wallet guidance">
          {walletTopics.map((topic, index) => {
            const TopicIcon = topic.icon;
            return (
              <details
                className="driver-wallet-topic-card"
                key={topic.title}
                open={index === 0}
              >
                <summary>
                  <span className="driver-wallet-topic-number">
                    <TopicIcon size={20} />
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <strong>{topic.title}</strong>
                  <ChevronDown size={22} />
                </summary>

                <div className="driver-wallet-topic-copy">
                  <p>{topic.content}</p>
                  {topic.example && (
                    <div className="driver-wallet-example">
                      <div>
                        <span>Accepted ride fare</span>
                        <strong>PKR 1,000.00</strong>
                      </div>
                      <div>
                        <span>Reserved platform fee</span>
                        <strong>PKR 120.00</strong>
                      </div>
                      <div>
                        <span>Balance still available</span>
                        <strong>Wallet total − PKR 120.00</strong>
                      </div>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </section>
      </main>
    </div>
  );
}

export default DriverWalletInfo;