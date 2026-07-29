import { useNavigate } from "react-router-dom";
import {
    CircleDollarSign,
    Info,
    ShieldCheck,
} from "lucide-react";
import "./DriverWalletInfo.css";

function DriverWalletInfo() {
    const navigate = useNavigate();

    return (
        <div className="page wallet-info-page">
            <div className="card wallet-info-card">
                <div className="wallet-info-heading">
                    <div className="icon-circle">
                        <CircleDollarSign size={36} color="white" />
                    </div>

                    <h1 className="title">
                        How the Velocity Wallet Works
                    </h1>

                    <p className="subtitle">
                        Your wallet is used only for Velocity fees.
                    </p>
                </div>

                <div className="wallet-info-scroll">
                    <section className="wallet-help-section">
                        <div className="help-title">
                            <ShieldCheck size={21} />
                            <h2>Passenger payments</h2>
                        </div>

                        <p>
                            Passengers pay drivers directly using cash or
                            digital transfer. Velocity does not hold the
                            passenger's ride payment.
                        </p>
                    </section>

                    <section className="wallet-help-section">
                        <div className="help-title">
                            <Info size={21} />
                            <h2>Available balance</h2>
                        </div>

                        <p>
                            This is the amount currently available in your
                            wallet for platform fees.
                        </p>
                    </section>

                    <section className="wallet-help-section">
                        <div className="help-title">
                            <Info size={21} />
                            <h2>Reserved fees</h2>
                        </div>

                        <p>
                            When a passenger accepts your offer, Velocity
                            temporarily reserves 12% of the accepted ride
                            fare from your wallet.
                        </p>

                        <div className="wallet-example">
                            <div>
                                <span>Accepted ride fare</span>
                                <strong>Rs 1,000.00</strong>
                            </div>

                            <div>
                                <span>Reserved platform fee</span>
                                <strong>Rs 120.00</strong>
                            </div>
                        </div>
                    </section>

                    <section className="wallet-help-section">
                        <div className="help-title">
                            <Info size={21} />
                            <h2>After ride completion</h2>
                        </div>

                        <p>
                            The reserved 12% platform fee is permanently
                            deducted when the ride is completed.
                        </p>
                    </section>

                    <section className="wallet-help-section">
                        <div className="help-title">
                            <Info size={21} />
                            <h2>Passenger cancellation</h2>
                        </div>

                        <p>
                            If the passenger cancels, the reserved platform
                            fee is released back into your available balance.
                        </p>
                    </section>

                    <section className="wallet-help-section">
                        <div className="help-title">
                            <Info size={21} />
                            <h2>Driver cancellation</h2>
                        </div>

                        <p>
                            If you cancel an accepted ride before it starts,
                            the 12% reservation is released and a 5%
                            cancellation fee is deducted from your wallet.
                        </p>
                    </section>

                    <section className="wallet-help-section">
                        <div className="help-title">
                            <Info size={21} />
                            <h2>Low wallet balance</h2>
                        </div>

                        <p>
                            You may be unable to accept a ride when your
                            available wallet balance is lower than the
                            required platform-fee reservation.
                        </p>
                    </section>

                    <section className="wallet-help-section">
                        <div className="help-title">
                            <Info size={21} />
                            <h2>Trip history</h2>
                        </div>

                        <p>
                            Your trip history shows the ride fare, platform
                            fee and your net earnings for completed rides.
                        </p>
                    </section>
                </div>

                <button
                    className="primary-btn wallet-info-back"
                    onClick={() => navigate("/driver-wallet")}
                >
                    Back to Wallet
                </button>
            </div>
        </div>
    );
}

export default DriverWalletInfo;