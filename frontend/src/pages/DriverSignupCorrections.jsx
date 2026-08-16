import { apiBaseUrl } from "../config/api.js";
import {
    useEffect,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    CheckCircle2,
    FileCheck2,
} from "lucide-react";
import "./DriverSignUP.css";
import "./DriverSignupCorrections.css";
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

const CORRECTION_FIELD_MAP = {
    full_name: "fullName",
    phone_number: "phoneNumber",
    email: "email",
    cnic_number: "cnicNumber",
    license_number: "licenseNumber",
    vehicle_make: "vehicleMake",
    vehicle_model: "vehicleModel",
    vehicle_year: "vehicleYear",
    vehicle_color: "vehicleColor",
    vehicle_plate_number:
        "vehiclePlateNumber",
    vehicle_capacity:
        "vehicleCapacity",
};

const EMPTY_FORM = {
    fullName: "",
    phoneNumber: "",
    email: "",
    cnicNumber: "",
    licenseNumber: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    vehiclePlateNumber: "",
    vehicleCapacity: "4",
};

function DriverSignupCorrections() {
    const navigate = useNavigate();

    const applicantToken =
        sessionStorage.getItem(
            "applicantToken"
        ) ||
        localStorage.getItem(
            "applicantToken"
        );

    const [form, setForm] =
        useState(EMPTY_FORM);

    const [applicationId, setApplicationId] =
        useState(null);

    const [previousAttempt, setPreviousAttempt] =
        useState(null);

    const [corrections, setCorrections] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const {
        loading: catalogLoading,
        error: catalogError,
        makeOptions,
        modelOptions,
        yearOptions,
        colorOptions,
        capacityOptions,
    } = useVehicleOptions(form.vehicleMake);

    const readResponse = async (
        response
    ) => {
        const responseText =
            await response.text();

        if (!responseText) {
            return {};
        }

        try {
            return JSON.parse(
                responseText
            );
        } catch {
            return {
                message: responseText,
            };
        }
    };

    const responseMessage = (
        data,
        fallback
    ) => {
        return (
            data.message ||
            data.details ||
            data.error ||
            fallback
        );
    };

    const handleExpiredSession = () => {
        sessionStorage.removeItem(
            "applicantToken"
        );

        localStorage.removeItem(
            "applicantToken"
        );

        sessionStorage.removeItem(
            "applicationStatus"
        );

        localStorage.removeItem(
            "applicationStatus"
        );

        navigate(
            "/driver-phone",
            {
                replace: true,
            }
        );
    };

    useEffect(() => {
        const loadCorrectionForm =
            async () => {
                if (!applicantToken) {
                    handleExpiredSession();
                    return;
                }

                setLoading(true);
                setError("");

                try {
                    const response =
                        await fetch(
                            `${API}/driver-registration/application/correction-form`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${applicantToken}`,
                                },
                            }
                        );

                    const data =
                        await readResponse(
                            response
                        );

                    if (
                        response.status ===
                        401
                    ) {
                        handleExpiredSession();
                        return;
                    }

                    /*
                     * An old browser tab can still point to this
                     * route after an admin approves the application.
                     * The backend correctly rejects correction access
                     * for both pending and approved applications.
                     * Return to status so an approved applicant is
                     * promoted to the normal driver session.
                     */
                    if (response.status === 409) {
                        navigate(
                            "/driver-application-status",
                            { replace: true }
                        );
                        return;
                    }

                    if (
                        !response.ok ||
                        !data.success
                    ) {
                        setError(
                            responseMessage(
                                data,
                                "Unable to load the correction form."
                            )
                        );

                        return;
                    }

                    const loadedCorrections =
                        Array.isArray(
                            data.corrections
                        )
                            ? data.corrections
                            : [];

                    setApplicationId(
                        data.applicationId
                    );

                    setPreviousAttempt(
                        data.attemptNumber
                    );

                    setCorrections(
                        loadedCorrections
                    );

                    setForm({
                        fullName:
                            data.fullName ||
                            "",
                        phoneNumber:
                            data.phoneNumber ||
                            "",
                        email:
                            data.email ||
                            "",
                        cnicNumber:
                            data.cnicNumber ||
                            "",
                        licenseNumber:
                            data.licenseNumber ||
                            "",
                        vehicleMake:
                            data.vehicleMake ||
                            "",
                        vehicleModel:
                            data.vehicleModel ||
                            "",
                        vehicleYear:
                            data.vehicleYear?.toString() ||
                            "",
                        vehicleColor:
                            data.vehicleColor ||
                            "",
                        vehiclePlateNumber:
                            data.vehiclePlateNumber ||
                            "",
                        vehicleCapacity:
                            data.vehicleCapacity?.toString() ||
                            "4",
                    });

                    const firstCorrection =
                        loadedCorrections[0];

                    const firstFieldId =
                        CORRECTION_FIELD_MAP[
                            firstCorrection
                                ?.fieldName
                        ];

                    if (firstFieldId) {
                        window.setTimeout(
                            () => {
                                const field =
                                    document.getElementById(
                                        firstFieldId
                                    );

                                field?.scrollIntoView(
                                    {
                                        behavior:
                                            "smooth",
                                        block:
                                            "center",
                                    }
                                );

                                field?.focus();
                            },
                            150
                        );
                    }
                } catch (requestError) {
                    console.error(
                        requestError
                    );

                    setError(
                        "Unable to connect to the application server."
                    );
                } finally {
                    setLoading(false);
                }
            };

        loadCorrectionForm();
    }, []);

    const correctionFor = (
        formFieldName
    ) => {
        return corrections.find(
            (correction) =>
                CORRECTION_FIELD_MAP[
                    correction.fieldName
                ] === formFieldName
        );
    };

    const fieldClassName = (
        formFieldName,
        fullWidth = false
    ) => {
        const classes = [
            "driver-signup-field",
        ];

        if (fullWidth) {
            classes.push(
                "full-width"
            );
        }

        if (
            correctionFor(
                formFieldName
            )
        ) {
            classes.push(
                "correction-required"
            );
        }

        return classes.join(" ");
    };

    const updateField = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const updateDigitsOnly = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]:
                value.replace(
                    /\D/g,
                    ""
                ),
        }));
    };

    const updateSelection = (
        name,
        value
    ) => {
        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const updateVehicleMake = (
        value
    ) => {
        setForm((current) => ({
            ...current,
            vehicleMake: value,
            vehicleModel: "",
        }));
    };

    const validateForm = () => {
        if (catalogLoading) {
            return "Approved vehicle options are still loading.";
        }

        if (catalogError) {
            return catalogError;
        }

        if (
            !form.fullName.trim() ||
            !form.phoneNumber.trim() ||
            !form.email.trim() ||
            !form.cnicNumber.trim() ||
            !form.licenseNumber.trim() ||
            !form.vehicleMake.trim() ||
            !form.vehicleModel.trim() ||
            !form.vehicleYear ||
            !form.vehicleColor.trim() ||
            !form.vehiclePlateNumber.trim() ||
            !form.vehicleCapacity
        ) {
            return "Please complete every required field.";
        }

        if (
            !/^03\d{9}$/.test(
                form.phoneNumber
            )
        ) {
            return "Phone number must use the format 03XXXXXXXXX.";
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                form.email
            )
        ) {
            return "Please enter a valid email address.";
        }

        if (
            !/^\d{13}$/.test(
                form.cnicNumber
            )
        ) {
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

        return "";
    };

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();
        setError("");

        const validationError =
            validateForm();

        if (validationError) {
            setError(
                validationError
            );

            return;
        }

        setSubmitting(true);

        try {
            const response =
                await fetch(
                    `${API}/driver-registration/application/resubmit`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${applicantToken}`,
                        },
                        body: JSON.stringify(
                            {
                                fullName:
                                    normalizePersonName(form.fullName),
                                phoneNumber:
                                    form.phoneNumber.trim(),
                                email:
                                    form.email.trim(),
                                cnicNumber:
                                    form.cnicNumber,
                                licenseNumber:
                                    normalizeLicenceNumber(form.licenseNumber),
                                vehicleMake:
                                    form.vehicleMake.trim(),
                                vehicleModel:
                                    form.vehicleModel.trim(),
                                vehicleYear:
                                    Number(
                                        form.vehicleYear
                                    ),
                                vehicleColor:
                                    form.vehicleColor.trim(),
                                vehiclePlateNumber:
                                    normalizePlateNumber(form.vehiclePlateNumber),
                                vehicleCapacity:
                                    Number(
                                        form.vehicleCapacity
                                    ),
                            }
                        ),
                    }
                );

            const data =
                await readResponse(
                    response
                );

            if (
                response.status === 401
            ) {
                handleExpiredSession();
                return;
            }

            if (
                !response.ok ||
                !data.success
            ) {
                setError(
                    responseMessage(
                        data,
                        "Unable to resubmit the application."
                    )
                );

                return;
            }

            sessionStorage.setItem(
                "applicationStatus",
                data.applicationStatus
            );

            setSuccessMessage(
                data.message ||
                "Your corrected application has been submitted for admin review."
            );
        } catch (requestError) {
            console.error(
                requestError
            );

            setError(
                "Unable to connect to the application server."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleSuccessOk = () => {
        navigate(
            "/driver-application-status",
            {
                replace: true,
            }
        );
    };

    const CorrectionMessage = ({
        fieldName,
    }) => {
        const correction =
            correctionFor(
                fieldName
            );

        if (!correction) {
            return null;
        }

        return (
            <div className="driver-correction-message">
                <AlertTriangle
                    size={17}
                />

                <span>
                    {
                        correction.instruction
                    }
                </span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="driver-signup-page">
                <div className="driver-correction-loading">
                    Loading your declined
                    application...
                </div>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className="driver-signup-page">
                <VelocityMark
                    className="driver-signup-logo"
                />

                <section className="driver-correction-success-card">
                    <div className="driver-correction-success-icon">
                        <CheckCircle2
                            size={44}
                        />
                    </div>

                    <h1>
                        Application Submitted
                    </h1>

                    <p>
                        {successMessage}
                    </p>

                    <button
                        type="button"
                        onClick={
                            handleSuccessOk
                        }
                    >
                        OK
                    </button>
                </section>
            </div>
        );
    }

    return (
        <div className="driver-signup-page">
            <VelocityMark
                className="driver-signup-logo"
            />

            <form
                className="driver-signup-card"
                onSubmit={
                    handleSubmit
                }
            >
                <div className="driver-signup-header">
                    <div className="driver-signup-icon declined">
                        <FileCheck2
                            size={38}
                        />
                    </div>

                    <h1 className="driver-signup-title">
                        Correct Application
                    </h1>

                    <p className="driver-signup-subtitle">
                        The marked fields require
                        correction. All other
                        information remains editable.
                    </p>

                    <div className="driver-correction-attempt">
                        Declined application #
                        {applicationId ||
                            "—"}
                        {" · "}
                        Previous attempt #
                        {previousAttempt ||
                            "—"}
                    </div>
                </div>

                <section className="driver-signup-section">
                    <h2>
                        Personal information
                    </h2>

                    <div className="driver-signup-grid">
                        <div
                            className={
                                fieldClassName(
                                    "fullName"
                                )
                            }
                        >
                            <label htmlFor="fullName">
                                Full name
                            </label>

                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                maxLength={100}
                                value={
                                    form.fullName
                                }
                                onChange={
                                    updateField
                                }
                                onBlur={() =>
                                    updateSelection(
                                        "fullName",
                                        normalizePersonName(form.fullName)
                                    )
                                }
                            />

                            <CorrectionMessage
                                fieldName="fullName"
                            />
                        </div>

                        <div
                            className={
                                fieldClassName(
                                    "phoneNumber"
                                )
                            }
                        >
                            <label htmlFor="phoneNumber">
                                Phone number
                            </label>

                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="text"
                                inputMode="numeric"
                                maxLength={11}
                                value={
                                    form.phoneNumber
                                }
                                onChange={
                                    updateDigitsOnly
                                }
                            />

                            <CorrectionMessage
                                fieldName="phoneNumber"
                            />
                        </div>

                        <div
                            className={
                                fieldClassName(
                                    "email"
                                )
                            }
                        >
                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                maxLength={100}
                                value={
                                    form.email
                                }
                                onChange={
                                    updateField
                                }
                            />

                            <CorrectionMessage
                                fieldName="email"
                            />
                        </div>

                        <div
                            className={
                                fieldClassName(
                                    "cnicNumber"
                                )
                            }
                        >
                            <label htmlFor="cnicNumber">
                                CNIC number
                            </label>

                            <input
                                id="cnicNumber"
                                name="cnicNumber"
                                type="text"
                                inputMode="numeric"
                                maxLength={13}
                                value={
                                    form.cnicNumber
                                }
                                onChange={
                                    updateDigitsOnly
                                }
                            />

                            <CorrectionMessage
                                fieldName="cnicNumber"
                            />
                        </div>
                    </div>
                </section>

                <section className="driver-signup-section">
                    <h2>
                        Driving licence
                    </h2>

                    <div className="driver-signup-grid">
                        <div
                            className={
                                fieldClassName(
                                    "licenseNumber",
                                    true
                                )
                            }
                        >
                            <label htmlFor="licenseNumber">
                                Licence number
                            </label>

                            <input
                                id="licenseNumber"
                                name="licenseNumber"
                                type="text"
                                maxLength={30}
                                value={
                                    form.licenseNumber
                                }
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

                            <CorrectionMessage
                                fieldName="licenseNumber"
                            />
                        </div>
                    </div>
                </section>

                <section className="driver-signup-section">
                    <h2>
                        Vehicle information
                    </h2>

                    <div className="driver-signup-grid">
                        <div
                            className={
                                fieldClassName(
                                    "vehicleMake"
                                )
                            }
                        >
                            <label htmlFor="vehicleMake">
                                Make
                            </label>

                            <SearchableSelect
                                id="vehicleMake"
                                value={
                                    form.vehicleMake
                                }
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

                            <CorrectionMessage
                                fieldName="vehicleMake"
                            />
                        </div>

                        <div
                            className={
                                fieldClassName(
                                    "vehicleModel"
                                )
                            }
                        >
                            <label htmlFor="vehicleModel">
                                Model
                            </label>

                            <SearchableSelect
                                id="vehicleModel"
                                value={
                                    form.vehicleModel
                                }
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

                            <CorrectionMessage
                                fieldName="vehicleModel"
                            />
                        </div>

                        <div
                            className={
                                fieldClassName(
                                    "vehicleYear"
                                )
                            }
                        >
                            <label htmlFor="vehicleYear">
                                Vehicle year
                            </label>

                            <SearchableSelect
                                id="vehicleYear"
                                value={
                                    form.vehicleYear
                                }
                                options={yearOptions}
                                placeholder="Search vehicle year"
                                disabled={catalogLoading || Boolean(catalogError)}
                                onChange={(value) =>
                                    updateSelection("vehicleYear", value)
                                }
                            />

                            <CorrectionMessage
                                fieldName="vehicleYear"
                            />
                        </div>

                        <div
                            className={
                                fieldClassName(
                                    "vehicleColor"
                                )
                            }
                        >
                            <label htmlFor="vehicleColor">
                                Color
                            </label>

                            <SearchableSelect
                                id="vehicleColor"
                                value={
                                    form.vehicleColor
                                }
                                options={colorOptions}
                                placeholder="Search approved colors"
                                showColorSwatch
                                disabled={catalogLoading || Boolean(catalogError)}
                                onChange={(value) =>
                                    updateSelection("vehicleColor", value)
                                }
                            />

                            <CorrectionMessage
                                fieldName="vehicleColor"
                            />
                        </div>

                        <div
                            className={
                                fieldClassName(
                                    "vehiclePlateNumber"
                                )
                            }
                        >
                            <label htmlFor="vehiclePlateNumber">
                                Plate number
                            </label>

                            <input
                                id="vehiclePlateNumber"
                                name="vehiclePlateNumber"
                                type="text"
                                maxLength={20}
                                value={
                                    form.vehiclePlateNumber
                                }
                                onChange={(event) =>
                                    updateSelection(
                                        "vehiclePlateNumber",
                                        normalizePlateNumber(event.target.value)
                                    )
                                }
                            />

                            <CorrectionMessage
                                fieldName="vehiclePlateNumber"
                            />
                        </div>

                        <div
                            className={
                                fieldClassName(
                                    "vehicleCapacity"
                                )
                            }
                        >
                            <label htmlFor="vehicleCapacity">
                                Passenger capacity
                            </label>

                            <SearchableSelect
                                id="vehicleCapacity"
                                value={
                                    form.vehicleCapacity
                                }
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

                            <CorrectionMessage
                                fieldName="vehicleCapacity"
                            />
                        </div>
                    </div>
                </section>

                {catalogError && (
                    <p className="vehicle-catalog-error">
                        {catalogError}
                    </p>
                )}

                {error && (
                    <p className="driver-signup-error">
                        {error}
                    </p>
                )}

                <button
                    className="driver-signup-submit"
                    type="submit"
                    disabled={
                        submitting ||
                        catalogLoading ||
                        Boolean(catalogError)
                    }
                >
                    {
                        submitting
                            ? "Submitting..."
                            : "Submit Corrected Application"
                    }
                </button>
            </form>
        </div>
    );
}

export default DriverSignupCorrections;
