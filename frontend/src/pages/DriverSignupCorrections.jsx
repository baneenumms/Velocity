import {
    useEffect,
    useMemo,
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

const API = "http://localhost:8080";

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

    const maximumVehicleYear = useMemo(
        () =>
            new Date().getFullYear() + 1,
        []
    );

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

    const validateForm = () => {
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

        const vehicleYear =
            Number(
                form.vehicleYear
            );

        if (
            vehicleYear < 2000 ||
            vehicleYear >
                maximumVehicleYear
        ) {
            return `Vehicle year must be between 2000 and ${maximumVehicleYear}.`;
        }

        if (
            Number(
                form.vehicleCapacity
            ) <= 0
        ) {
            return "Vehicle capacity must be greater than zero.";
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
                                    form.fullName.trim(),
                                phoneNumber:
                                    form.phoneNumber.trim(),
                                email:
                                    form.email.trim(),
                                cnicNumber:
                                    form.cnicNumber,
                                licenseNumber:
                                    form.licenseNumber.trim(),
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
                                    form.vehiclePlateNumber.trim(),
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

            localStorage.setItem(
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
                                maxLength={50}
                                value={
                                    form.licenseNumber
                                }
                                onChange={
                                    updateField
                                }
                            />

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

                            <input
                                id="vehicleMake"
                                name="vehicleMake"
                                type="text"
                                maxLength={50}
                                value={
                                    form.vehicleMake
                                }
                                onChange={
                                    updateField
                                }
                            />

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

                            <input
                                id="vehicleModel"
                                name="vehicleModel"
                                type="text"
                                maxLength={50}
                                value={
                                    form.vehicleModel
                                }
                                onChange={
                                    updateField
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

                            <input
                                id="vehicleYear"
                                name="vehicleYear"
                                type="number"
                                min="2000"
                                max={
                                    maximumVehicleYear
                                }
                                value={
                                    form.vehicleYear
                                }
                                onChange={
                                    updateField
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

                            <input
                                id="vehicleColor"
                                name="vehicleColor"
                                type="text"
                                maxLength={30}
                                value={
                                    form.vehicleColor
                                }
                                onChange={
                                    updateField
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
                                onChange={
                                    updateField
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
                                Seating capacity
                            </label>

                            <input
                                id="vehicleCapacity"
                                name="vehicleCapacity"
                                type="number"
                                min="1"
                                value={
                                    form.vehicleCapacity
                                }
                                onChange={
                                    updateField
                                }
                            />

                            <CorrectionMessage
                                fieldName="vehicleCapacity"
                            />
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
                    disabled={
                        submitting
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
