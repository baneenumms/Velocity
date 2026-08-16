import { apiBaseUrl } from "../config/api.js";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Eye,
    EyeOff,
    UserRoundPlus,
} from "lucide-react";
import "./DriverSignUP.css";
import VelocityMark from "../components/VelocityMark";
import SearchableSelect from "../components/SearchableSelect";
import useVehicleOptions from "../hooks/useVehicleOptions";
import {
    isApprovedOption,
    normalizeLicenceNumber,
    normalizePersonName,
    normalizePlateNumber,
} from "../utils/inputNormalization";

const API = apiBaseUrl;

function DriverSignUP() {

    const location = useLocation();
    const navigate = useNavigate();

    const phone = location.state?.phone || "";

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
        vehicleCapacity: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const {
        loading: catalogLoading,
        error: catalogError,
        makeOptions,
        modelOptions,
        yearOptions,
        colorOptions,
        capacityOptions,
    } = useVehicleOptions(form.vehicleMake);

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

    const updateVehicleMake = (value) => {
        setForm((current) => ({
            ...current,
            vehicleMake: value,
            vehicleModel: "",
        }));
    };

    const updateSelection = (name, value) => {
        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const validateForm = () => {

        if (!phone) {
            return "Please begin registration from the driver phone page.";
        }

        if (catalogLoading) {
            return "Approved vehicle options are still loading.";
        }

        if (catalogError) {
            return catalogError;
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

        if (!/^[A-Z0-9]{3,30}$/.test(form.licenseNumber)) {
            return "Licence number must contain 3 to 30 letters and numbers without spaces or dashes.";
        }

        if (!isApprovedOption(form.vehicleMake, makeOptions)) {
            return "Please select an approved vehicle make.";
        }

        if (!isApprovedOption(form.vehicleModel, modelOptions)) {
            return "Please select an approved model for the selected make.";
        }

        if (!yearOptions.includes(form.vehicleYear)) {
            return "Please select an approved vehicle year.";
        }

        if (!isApprovedOption(form.vehicleColor, colorOptions)) {
            return "Please select an approved vehicle color.";
        }

        if (!capacityOptions.includes(form.vehicleCapacity)) {
            return "Please select the passenger capacity.";
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
                        fullName: normalizePersonName(form.fullName),
                        phoneNumber: phone,
                        email: form.email.trim(),
                        cnicNumber: form.cnicNumber,
                        licenseNumber:
                            normalizeLicenceNumber(form.licenseNumber),
                        vehicleMake:
                            form.vehicleMake.trim(),
                        vehicleModel:
                            form.vehicleModel.trim(),
                        vehicleYear:
                            Number(form.vehicleYear),
                        vehicleColor:
                            form.vehicleColor.trim(),
                        vehiclePlateNumber:
                            normalizePlateNumber(form.vehiclePlateNumber),
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
                                onBlur={() =>
                                    updateSelection(
                                        "fullName",
                                        normalizePersonName(form.fullName)
                                    )
                                }
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
                                maxLength={30}
                                value={form.licenseNumber}
                                placeholder="Letters and numbers only"
                                onChange={(event) =>
                                    updateSelection(
                                        "licenseNumber",
                                        normalizeLicenceNumber(event.target.value)
                                    )
                                }
                            />

                            <p className="driver-signup-hint">
                                Enter 3–30 letters and numbers exactly as printed, without spaces or dashes.
                            </p>

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

                            <SearchableSelect
                                id="vehicleMake"
                                value={form.vehicleMake}
                                options={makeOptions}
                                placeholder={
                                    catalogLoading
                                        ? "Loading approved makes..."
                                        : "Search approved makes"
                                }
                                disabled={catalogLoading || Boolean(catalogError)}
                                onChange={updateVehicleMake}
                            />

                            <p className="vehicle-select-hint">
                                Start typing, then select an approved make.
                            </p>

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="vehicleModel">
                                Model
                            </label>

                            <SearchableSelect
                                id="vehicleModel"
                                value={form.vehicleModel}
                                options={modelOptions}
                                placeholder={
                                    form.vehicleMake
                                        ? "Search approved models"
                                        : "Select a make first"
                                }
                                disabled={!isApprovedOption(form.vehicleMake, makeOptions)}
                                onChange={(value) =>
                                    updateSelection("vehicleModel", value)
                                }
                            />

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="vehicleYear">
                                Vehicle year
                            </label>

                            <SearchableSelect
                                id="vehicleYear"
                                value={form.vehicleYear}
                                options={yearOptions}
                                placeholder="Search vehicle year"
                                disabled={catalogLoading || Boolean(catalogError)}
                                onChange={(value) =>
                                    updateSelection("vehicleYear", value)
                                }
                            />

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="vehicleColor">
                                Color
                            </label>

                            <SearchableSelect
                                id="vehicleColor"
                                value={form.vehicleColor}
                                options={colorOptions}
                                placeholder="Search approved colors"
                                showColorSwatch
                                disabled={catalogLoading || Boolean(catalogError)}
                                onChange={(value) =>
                                    updateSelection("vehicleColor", value)
                                }
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
                                onChange={(event) =>
                                    updateSelection(
                                        "vehiclePlateNumber",
                                        normalizePlateNumber(event.target.value)
                                    )
                                }
                            />

                        </div>

                        <div className="driver-signup-field">

                            <label htmlFor="vehicleCapacity">
                                Passenger capacity
                            </label>

                            <SearchableSelect
                                id="vehicleCapacity"
                                value={form.vehicleCapacity}
                                options={capacityOptions}
                                placeholder="Select capacity"
                                disabled={catalogLoading || Boolean(catalogError)}
                                onChange={(value) =>
                                    updateSelection("vehicleCapacity", value)
                                }
                            />

                            <p className="vehicle-select-hint">
                                Number of passengers, excluding the driver.
                            </p>

                        </div>

                    </div>

                </section>

                {catalogError && (
                    <p className="vehicle-catalog-error">
                        {catalogError}
                    </p>
                )}

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
                    disabled={loading || catalogLoading || Boolean(catalogError)}
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
