import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import HamburgerMenu from "../components/HamburgerMenu";
import "./DriverWallet.css";

function DriverWallet() {

    const navigate = useNavigate();

    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const driverId = localStorage.getItem("driverId");

    useEffect(() => {

        const fetchWallet = async () => {

            try {

                const response = await fetch(
                    `http://localhost:8080/drivers/wallet/${driverId}`
                );

                if (!response.ok) {
                    setError("Unable to load wallet.");
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setWallet(data);
                setLoading(false);

            } catch (err) {

                console.error(err);
                setError("Unable to connect to server.");
                setLoading(false);

            }
        };

        if (driverId) {
            fetchWallet();
        } else {
            setError("No driver session found. Please log in again.");
            setLoading(false);
        }

    }, [driverId]);

    return (

        <div className="page wallet-page">

            <HamburgerMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
            />

            <div className="dashboard-header">

                <button
                    className="menu-btn"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                >
                    ☰
                </button>

                <div className="velocity-title small">
                    <span className="velo">VEL</span>
                    <span className="wheel">
                        <span className="hub"></span>
                    </span>
                    <span className="city">CITY</span>
                </div>

            </div>

            <div className="card wallet-card">

                <div className="icon-circle">
                    <Wallet size={36} color="white" />
                </div>

                <h1 className="title">My Wallet</h1>

                <p className="subtitle">
                    Your current platform balance.
                </p>

                {loading && (
                    <p className="subtitle">Loading wallet...</p>
                )}

                {error && (
                    <p className="error">{error}</p>
                )}

                {!loading && !error && wallet && (

                    <div className="balance-box">

                        <span className="balance-label">Available Balance</span>

                        <span className="balance-amount">
                            Rs {wallet.balance.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>

                    </div>

                )}

                <button
                    className="primary-btn back-btn"
                    onClick={() => navigate("/driver-dashboard")}
                >
                    Back to Home
                </button>

            </div>

        </div>

    );

}

export default DriverWallet;