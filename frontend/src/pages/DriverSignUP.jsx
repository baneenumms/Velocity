import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Eye,
    EyeOff,
    UserRoundPlus,
} from "lucide-react";
import "./DriverSignUP.css";
import VelocityMark from "../components/VelocityMark";

const API = "http://localhost:8080";

function DriverSignUP() {

    const location = useLocation();
    const navigate = useNavigate();

    const phone = location.state?.phone || "";

    const maximumVehicleYear = useMemo(
        () => new Date().getFullYear() + 1,
        []
    );

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        cnicNumber: "",
        licenseNumber: "",
        vehicleMake: "",
        vehicleModel: "",
        vehicleYear: "",
        vehicleColor: "",
        vehiclePlateNumber: "",
        vehicleCapacity: "4",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const updateDigitsOnly = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value.replace(/\D/g, ""),
        }));
    };

    const validateForm = () => {

        if (!phone) {
            return "Please begin registration from the driver phone page.";
        }

        if (
            !form.fullName.trim()
            || !form.email.trim()
            || !form.cnicNumber.trim()
            || !form.licenseNumber.trim()
            || !form.vehicleMake.trim()
            || !form.vehicleModel.trim()
            || !form.vehicleYear
            || !form.vehicleColor.trim()
            || !form.vehiclePlateNumber.trim()
            || !form.vehicleCapacity
            || !form.password
            || !form.confirmPassword
        ) {
            return "Please complete every required field.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            form.email
        )) {
            return "Please enter a valid email address.";
        }

        if (!/^\d{13}$/.test(form.cnicNumber)) {
            return "CNIC must contain exactly 13 digits.";
        }

        const vehicleYear = Number(form.vehicleYear);

        if (
            vehicleYear < 2000
            || vehicleYear > maximumVehicleYear
        ) {
            return `Vehicle year must be between 2000 and ${maximumVehicleYear}.`;
        }

        if (Number(form.vehicleCapacity) <= 0) {
            return "Vehicle capacity must be greater than zero.";
        }

        if (form.password.length < 6) {
            return "Password must contain at least 6 characters.";
        }

        if (form.password !== form.confirmPassword) {
            return "Passwords do not match.";
        }

        return "";
    };

    const readResponse = async (response) => {

        const responseText = await response.text();

        if (!responseText) {
            return {};
        }

        try {
            return JSON.parse(responseText);
        } catch {
            return {
                message: responseText,
            };
        }
    };

    const handleSubmit = async (event) => {

        event.preventDefault();
        setError("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                `${API}/driver-registration/signup/send-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fullName: form.fullName.trim(),
                        phoneNumber: phone,
                        email: form.email.trim(),
                        cnicNumber: form.cnicNumber,
                        licenseNumber:
                            form.licenseNumber.trim(),
                        vehicleMake:
                            form.vehicleMake.trim(),
                        vehicleModel:
                            form.vehicleModel.trim(),
                        vehicleYear:
                            Number(form.vehicleYear),
                        vehicleColor:
                            form.vehicleColor.trim(),
                        vehiclePlateNumber:
                            form.vehiclePlateNumber.trim(),
                        vehicleCapacity:
                            Number(form.vehicleCapacity),
                        password: form.password,
                    }),
                }
            );

            const data = await readResponse(response);

            if (
                !response.ok
                || !data.success
                || !data.registrationToken
            ) {
                setError(
                    data.message
                    || data.details
                    || data.error
                    || "Unable to start driver registration."
                );
                return;
            }

            navigate(
                "/driver-signup-otp",
                {
                    replace: true,
                    state: {
                        phone,
                        maskedEmail: data.maskedEmail,
                        registrationToken:
                            data.registrationToken,
                    },
                }
            );

        } catch (requestError) {

            console.error(requestError);

            setError(
                "Unable to connect to the registration server."
            );

        } finally {

            setLoading(false);

        }
    };

    return (

        <div className="driver-signup-page">

            <VelocityMark className="driver-signup-logo" />

            <form
                className="driver-signup-card"
                onSubmit={handleSubmit}
            >

                <div className="driver-signup-header">

                    <div className="driver-signup-icon">
                        <UserRoundPlus size={38} />
                    </div>

                    <h1 className="driver-signup-title">
                        Driver Registration
                    </h1>

                    <p className="driver-signup-subtitle">
                        Submit your personal, licence and
                        vehicle information for admin review.
                        No document upload is required.
                    </p>

                    <div className="driver-signup-phone">
                        Registered Phone
                        <strong>
                            {phone || "Not provided"}
                        </strong>
                    </div>

                </div>

                <section className="driver-signup-section">

                    <h2>Personal information</h2>

                    <div className="driver-signup-grid">

                        <div className="driver-signup-field">

                            <label htmlFor="fullName">
                                Full name
                            </label>

                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                maxLength={100}
                                value={form.fullName}
                                autoFocus
                                onChange={updateField}
                                autoComplete="name"
                            />

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                maxLength={100}
                                value={form.email}
                                onChange={updateField}
                                autoComplete="email"
                            />

                        </div>

                        <div className="driver-signup-field full-width">

                            <label htmlFor="cnicNumber">
                                CNIC number
                            </label>

                            <input
                                id="cnicNumber"
                                name="cnicNumber"
                                type="text"
                                inputMode="numeric"
                                maxLength={13}
                                placeholder="13 digits without dashes"
                                value={form.cnicNumber}
                                onChange={updateDigitsOnly}
                            />

                        </div>

                    </div>

                </section>

                <section className="driver-signup-section">

                    <h2>Driving licence</h2>

                    <div className="driver-signup-grid">

                        <div className="driver-signup-field full-width">

                            <label htmlFor="licenseNumber">
                                Licence number
                            </label>

                            <input
                                id="licenseNumber"
                                name="licenseNumber"
                                type="text"
                                maxLength={50}
                                value={form.licenseNumber}
                                onChange={updateField}
                            />

                        </div>

                    </div>

                </section>

                <section className="driver-signup-section">

                    <h2>Vehicle information</h2>

                    <div className="driver-signup-grid">

                        <div className="driver-signup-field">

                            <label htmlFor="vehicleMake">
                                Make
                            </label>

                            <input
                                id="vehicleMake"
                                name="vehicleMake"
                                type="text"
                                maxLength={50}
                                placeholder="Toyota"
                                value={form.vehicleMake}
                                onChange={updateField}
                            />

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="vehicleModel">
                                Model
                            </label>

                            <input
                                id="vehicleModel"
                                name="vehicleModel"
                                type="text"
                                maxLength={50}
                                placeholder="Corolla"
                                value={form.vehicleModel}
                                onChange={updateField}
                            />

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="vehicleYear">
                                Vehicle year
                            </label>

                            <input
                                id="vehicleYear"
                                name="vehicleYear"
                                type="number"
                                min="2000"
                                max={maximumVehicleYear}
                                value={form.vehicleYear}
                                onChange={updateField}
                            />

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="vehicleColor">
                                Color
                            </label>

                            <input
                                id="vehicleColor"
                                name="vehicleColor"
                                type="text"
                                maxLength={30}
                                value={form.vehicleColor}
                                onChange={updateField}
                            />

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="vehiclePlateNumber">
                                Plate number
                            </label>

                            <input
                                id="vehiclePlateNumber"
                                name="vehiclePlateNumber"
                                type="text"
                                maxLength={20}
                                value={form.vehiclePlateNumber}
                                onChange={updateField}
                            />

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="vehicleCapacity">
                                Seating capacity
                            </label>

                            <input
                                id="vehicleCapacity"
                                name="vehicleCapacity"
                                type="number"
                                min="1"
                                value={form.vehicleCapacity}
                                onChange={updateField}
                            />

                        </div>

                    </div>

                </section>

                <section className="driver-signup-section">

                    <h2>Driver password</h2>

                    <div className="driver-signup-grid">

                        <div className="driver-signup-field">

                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="driver-signup-password-wrap">

                                <input
                                    id="password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={form.password}
                                    onChange={updateField}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="driver-signup-password-toggle"
                                    onClick={() =>
                                        setShowPassword(
                                            (visible) => !visible
                                        )
                                    }
                                    aria-label="Show or hide password"
                                >
                                    {
                                        showPassword
                                            ? <EyeOff size={20} />
                                            : <Eye size={20} />
                                    }
                                </button>

                            </div>

                            <p className="driver-signup-hint">
                                Use at least 6 characters.
                            </p>

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="confirmPassword">
                                Confirm password
                            </label>

                            <div className="driver-signup-password-wrap">

                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={form.confirmPassword}
                                    onChange={updateField}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="driver-signup-password-toggle"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            (visible) => !visible
                                        )
                                    }
                                    aria-label="Show or hide password confirmation"
                                >
                                    {
                                        showConfirmPassword
                                            ? <EyeOff size={20} />
                                            : <Eye size={20} />
                                    }
                                </button>

                            </div>

                        </div>

                    </div>

                </section>

                {error && (
                    <p className="driver-signup-error">
                        {error}
                    </p>
                )}

                <button
                    className="driver-signup-submit"
                    type="submit"
                    disabled={loading}
                >
                    {
                        loading
                            ? "Sending OTP..."
                            : "Submit and Verify Email"
                    }
                </button>

            </form>

        </div>

    );

}

export default DriverSignUP;
