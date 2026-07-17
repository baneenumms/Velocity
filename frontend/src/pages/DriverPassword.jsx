import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import "./DriverPassword.css";

function DriverPassword() {

    const navigate = useNavigate();
    const location = useLocation();

    const { phone } = location.state || {};

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {

        setError("");

        if (password.trim() === "") {
            setError("Please enter your password.");
            return;
        }

        try {

            const response = await fetch(
                "http://localhost:8080/driver-auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        phoneNumber: phone,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!data.success) {
                setError("Incorrect password. Please try again.");
                return;
            }

            navigate("/driver-dashboard");

        } catch (err) {

            console.error(err);
            setError("Unable to connect to server.");

        }

    };

    return (

        <div className="page">

            <div className="velocity-title">
                <span className="velo">VEL</span>
                <span className="wheel">
                    <span className="hub"></span>
                </span>
                <span className="city">CITY</span>
            </div>

            <div className="card">

                <div className="icon-circle">
                    <Lock size={36} color="white" />
                </div>

                <h1 className="title">
                    Enter your password
                </h1>

                <p className="subtitle">
                    Welcome back! Enter your password to continue.
                </p>

                <div className="password-input">

                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>

                </div>

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                <button
                    className="primary-btn"
                    onClick={handleLogin}
                >
                    Login
                </button>

            </div>

        </div>

    );

}

export default DriverPassword;