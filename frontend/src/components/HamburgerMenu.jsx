import { useNavigate } from "react-router-dom";
import "./HamburgerMenu.css";

function HamburgerMenu({ open, onClose }) {

    const navigate = useNavigate();

    const goTo = (path) => {
        onClose();
        navigate(path);
    };

    const handleLogout = () => {
        localStorage.removeItem("driverId");
        localStorage.removeItem("userId");
        onClose();
        navigate("/");
    };

    return (

        <>
            <div
                className={`menu-overlay ${open ? "open" : ""}`}
                onClick={onClose}
            ></div>

            <div className={`menu-panel ${open ? "open" : ""}`}>

                <button
                    className="menu-close"
                    onClick={onClose}
                    aria-label="Close menu"
                >
                    ✕
                </button>

                <nav className="menu-nav">

                    <button onClick={() => goTo("/driver-dashboard")}>
                        Home
                    </button>

                    <button onClick={() => goTo("/driver-profile")}>
                        Profile
                    </button>

                    <button onClick={() => goTo("/driver-wallet")}>
                        My Wallet
                    </button>

                    <button onClick={() => goTo("/driver-trips")}>
                        Trip History
                    </button>

                    <button onClick={() => goTo("/driver-terms")}>
                        Terms &amp; Conditions
                    </button>

                    <button className="menu-logout" onClick={handleLogout}>
                        Logout
                    </button>

                </nav>

            </div>
        </>

    );

}

export default HamburgerMenu;
