import { apiBaseUrl } from "../config/api.js";
import {
    useEffect,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle2,
    RefreshCw,
    X,
} from "lucide-react";
import "./AdminDriverApplications.css";

const API = apiBaseUrl;

const FILTERS = [
    "PENDING_REVIEW",
    "APPROVED",
    "DECLINED",
    "ALL",
];

const CORRECTABLE_FIELDS = [
    { key: "full_name", label: "Full Name" },
    { key: "phone_number", label: "Phone Number" },
    { key: "email", label: "Email" },
    { key: "cnic_number", label: "CNIC Number" },
    { key: "license_number", label: "Licence Number" },
    { key: "vehicle_make", label: "Vehicle Make" },
    { key: "vehicle_model", label: "Vehicle Model" },
    { key: "vehicle_year", label: "Vehicle Year" },
    { key: "vehicle_color", label: "Vehicle Color" },
    {
        key: "vehicle_plate_number",
        label: "Vehicle Plate Number",
    },
    {
        key: "vehicle_capacity",
        label: "Vehicle Capacity",
    },
];

function createEmptyCorrections() {
    return CORRECTABLE_FIELDS.reduce(
        (result, field) => {
            result[field.key] = {
                selected: false,
                instruction: "",
            };

            return result;
        },
        {}
    );
}

function AdminDriverApplications() {
    const navigate = useNavigate();

    const adminToken =
        sessionStorage.getItem("adminToken") ||
        localStorage.getItem("adminToken");

    const isAdmin =
        sessionStorage.getItem("isAdmin") === "true" ||
        localStorage.getItem("isAdmin") === "true";

    const [filter, setFilter] =
        useState("PENDING_REVIEW");

    const [applications, setApplications] =
        useState([]);

    const [selected, setSelected] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [declineOpen, setDeclineOpen] =
        useState(false);

    const [reviewSummary, setReviewSummary] =
        useState("");

    const [suspendAccount, setSuspendAccount] =
        useState(false);

    const [suspensionReason, setSuspensionReason] =
        useState("");

    const [corrections, setCorrections] =
        useState(createEmptyCorrections);

    const [actionMessage, setActionMessage] =
        useState(null);

    const readResponse = async (response) => {
        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch {
            return {
                message: text,
            };
        }
    };

    const requestErrorMessage = (
        response,
        data,
        fallback
    ) => {
        if (response.status === 401) {
            return "Admin session expired. Log out and sign in again.";
        }

        return (
            data.message ||
            data.details ||
            data.error ||
            fallback
        );
    };

    const endExpiredAdminSession = () => {
        ["adminToken", "isAdmin", "velocitySession"]
            .forEach((key) => {
                sessionStorage.removeItem(key);
                localStorage.removeItem(key);
            });

        navigate("/role", {
            replace: true,
            state: {
                message: "Your admin session expired. Please sign in again.",
            },
        });
    };

    const loadApplications = async (
        requestedFilter = filter
    ) => {
        if (!isAdmin || !adminToken) {
            navigate(
                "/driver-dashboard",
                {
                    replace: true,
                }
            );

            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API}/admin/driver-applications?status=${requestedFilter}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${adminToken}`,
                    },
                }
            );

            const data =
                await readResponse(response);

            if (!response.ok) {
                if (response.status === 401) {
                    endExpiredAdminSession();
                    return;
                }

                setError(
                    requestErrorMessage(
                        response,
                        data,
                        "Unable to load driver applications."
                    )
                );

                return;
            }

            setApplications(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (requestError) {
            console.error(requestError);

            setError(
                "Unable to connect to the admin server."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications(filter);
    }, [filter]);

    const openApplication = async (
        applicationId
    ) => {
        setError("");

        try {
            const response = await fetch(
                `${API}/admin/driver-applications/${applicationId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${adminToken}`,
                    },
                }
            );

            const data =
                await readResponse(response);

            if (!response.ok) {
                setError(
                    requestErrorMessage(
                        response,
                        data,
                        "Unable to load application details."
                    )
                );

                return;
            }

            setSelected(data);
            setDeclineOpen(false);
            setReviewSummary("");
            setSuspendAccount(false);
            setSuspensionReason("");
            setCorrections(
                createEmptyCorrections()
            );
        } catch (requestError) {
            console.error(requestError);

            setError(
                "Unable to connect to the admin server."
            );
        }
    };

    const closeApplication = () => {
        setSelected(null);
        setDeclineOpen(false);
        setError("");
    };

    const approveApplication = async () => {
        if (!selected?.canApprove) {
            return;
        }

        setActionLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API}/admin/driver-applications/${selected.applicationId}/approve`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${adminToken}`,
                    },
                    body: JSON.stringify({
                        reviewSummary:
                            "Application details manually reviewed and approved.",
                    }),
                }
            );

            const data =
                await readResponse(response);

            if (
                !response.ok ||
                !data.success
            ) {
                setError(
                    requestErrorMessage(
                        response,
                        data,
                        "Unable to approve application."
                    )
                );

                return;
            }

            setSelected(null);
            setDeclineOpen(false);

            setActionMessage({
                title:
                    "Application Approved",
                message:
                    data.message ||
                    "The driver account, vehicle and zero-balance wallet were created successfully.",
            });

            await loadApplications(filter);
        } catch (requestError) {
            console.error(requestError);

            setError(
                "Unable to connect to the admin server."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const toggleCorrection = (
        fieldName
    ) => {
        setCorrections((current) => ({
            ...current,
            [fieldName]: {
                ...current[fieldName],
                selected:
                    !current[fieldName]
                        .selected,
            },
        }));
    };

    const updateInstruction = (
        fieldName,
        instruction
    ) => {
        setCorrections((current) => ({
            ...current,
            [fieldName]: {
                ...current[fieldName],
                instruction,
            },
        }));
    };

    const declineApplication = async () => {
        const selectedCorrections =
            CORRECTABLE_FIELDS
                .filter(
                    (field) =>
                        corrections[field.key]
                            .selected
                )
                .map((field) => ({
                    fieldName:
                        field.key,
                    instruction:
                        corrections[field.key]
                            .instruction
                            .trim(),
                }));

        if (
            selectedCorrections.length === 0
        ) {
            setError(
                "Select at least one incorrect field."
            );

            return;
        }

        const missingInstruction =
            selectedCorrections.some(
                (correction) =>
                    !correction.instruction
            );

        if (missingInstruction) {
            setError(
                "Provide an instruction for every selected field."
            );

            return;
        }

        if (
            suspendAccount &&
            !suspensionReason.trim()
        ) {
            setError(
                "Provide a reason before suspending the account."
            );

            return;
        }

        setActionLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API}/admin/driver-applications/${selected.applicationId}/decline`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${adminToken}`,
                    },
                    body: JSON.stringify({
                        reviewSummary:
                            reviewSummary.trim() ||
                            "Application requires corrections.",
                        corrections:
                            selectedCorrections,
                        suspendAccount,
                        suspensionReason:
                            suspendAccount
                                ? suspensionReason.trim()
                                : null,
                    }),
                }
            );

            const data =
                await readResponse(response);

            if (
                !response.ok ||
                !data.success
            ) {
                setError(
                    requestErrorMessage(
                        response,
                        data,
                        "Unable to decline application."
                    )
                );

                return;
            }

            setSelected(null);
            setDeclineOpen(false);

            setActionMessage({
                title:
                    "Application Declined",
                message:
                    data.message ||
                    "The applicant can now view the correction instructions and submit a new attempt.",
            });

            await loadApplications(filter);
        } catch (requestError) {
            console.error(requestError);

            setError(
                "Unable to connect to the admin server."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (value) => {
        if (!value) {
            return "Not available";
        }

        return new Date(
            value
        ).toLocaleString();
    };

    const displayFilter = (value) => {
        if (!value) {
            return "";
        }

        return value
            .replaceAll("_", " ")
            .replace(
                /\b\w/g,
                (letter) =>
                    letter.toUpperCase()
            );
    };

    return (
        <div className="admin-applications-page">
            {actionMessage && (
                <div
                    className="admin-action-message-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="admin-action-message-title"
                >
                    <div className="admin-action-message-card">
                        <div className="admin-action-message-icon">
                            <CheckCircle2
                                size={44}
                            />
                        </div>

                        <h2 id="admin-action-message-title">
                            {
                                actionMessage.title
                            }
                        </h2>

                        <p>
                            {
                                actionMessage.message
                            }
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setActionMessage(
                                    null
                                )
                            }
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <div className="admin-applications-container">
                <header className="admin-page-heading-row">
                    <div className="admin-applications-heading">
                        <span className="admin-page-eyebrow">
                            Driver onboarding
                        </span>

                        <h1>
                            Driver Applications
                        </h1>

                        <p>
                            Review submitted CNIC,
                            licence and vehicle
                            information without viewing
                            passwords or OTP values.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-page-refresh-button"
                        onClick={() =>
                            loadApplications(
                                filter
                            )
                        }
                        disabled={loading}
                    >
                        <RefreshCw
                            size={18}
                            className={
                                loading
                                    ? "spinning"
                                    : ""
                            }
                        />
                        Refresh
                    </button>
                </header>

                <div className="admin-application-tabs">
                    {FILTERS.map(
                        (value) => (
                            <button
                                key={value}
                                className={
                                    `admin-application-tab ${
                                        filter ===
                                        value
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={() => {
                                    setFilter(
                                        value
                                    );

                                    setSelected(
                                        null
                                    );
                                }}
                            >
                                {
                                    displayFilter(
                                        value
                                    )
                                }
                            </button>
                        )
                    )}
                </div>

                {error && (
                    <div className="admin-applications-error">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="admin-applications-loading">
                        Loading applications...
                    </div>
                ) : applications.length ===
                  0 ? (
                    <div className="admin-applications-empty">
                        No applications found
                        in this category.
                    </div>
                ) : (
                    <section className="admin-application-list">
                        {applications.map(
                            (application) => (
                                <article
                                    className="admin-application-card"
                                    key={
                                        application.applicationId
                                    }
                                >
                                    <div className="admin-application-card-top">
                                        <div>
                                            <h2>
                                                {
                                                    application.fullName
                                                }
                                            </h2>

                                            <p>
                                                Application #
                                                {
                                                    application.applicationId
                                                }
                                            </p>
                                        </div>

                                        <span
                                            className={
                                                `admin-application-status ${
                                                    (
                                                        application.status ||
                                                        ""
                                                    ).toLowerCase()
                                                }`
                                            }
                                        >
                                            {
                                                displayFilter(
                                                    application.status
                                                )
                                            }
                                        </span>
                                    </div>

                                    <div className="admin-application-card-meta">
                                        <div>
                                            <strong>
                                                Attempt:
                                            </strong>{" "}
                                            {
                                                application.attemptNumber
                                            }
                                        </div>

                                        <div>
                                            <strong>
                                                Account:
                                            </strong>{" "}
                                            {
                                                application.existingPassenger
                                                    ? "Existing passenger"
                                                    : "New driver applicant"
                                            }
                                        </div>

                                        <div>
                                            <strong>
                                                Submitted:
                                            </strong>{" "}
                                            {
                                                formatDate(
                                                    application.submittedAt
                                                )
                                            }
                                        </div>
                                    </div>

                                    <button
                                        className="admin-application-view"
                                        onClick={() =>
                                            openApplication(
                                                application.applicationId
                                            )
                                        }
                                    >
                                        View Application
                                    </button>
                                </article>
                            )
                        )}
                    </section>
                )}

                {selected && (
                    <section className="admin-application-detail">
                        <div className="admin-application-detail-header">
                            <div>
                                <h2>
                                    Application #
                                    {
                                        selected.applicationId
                                    }
                                </h2>

                                <p>
                                    Attempt #
                                    {
                                        selected.attemptNumber
                                    }
                                    {" · "}
                                    {
                                        displayFilter(
                                            selected.status
                                        )
                                    }
                                </p>
                            </div>

                            <button
                                className="admin-application-detail-close"
                                onClick={
                                    closeApplication
                                }
                                aria-label="Close application"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <div className="admin-application-section">
                            <h3>
                                Personal information
                            </h3>

                            <div className="admin-application-fields">
                                <ApplicationField
                                    label="Full Name"
                                    value={
                                        selected.fullName
                                    }
                                />

                                <ApplicationField
                                    label="Phone Number"
                                    value={
                                        selected.phoneNumber
                                    }
                                />

                                <ApplicationField
                                    label="Email"
                                    value={
                                        selected.email
                                    }
                                />

                                <ApplicationField
                                    label="CNIC Number"
                                    value={
                                        selected.cnicNumber
                                    }
                                />

                                <ApplicationField
                                    label="Account Status"
                                    value={
                                        selected.accountStatus
                                    }
                                />

                                <ApplicationField
                                    label="Existing Account"
                                    value={
                                        selected.existingPassenger
                                            ? "Passenger applying as driver"
                                            : "New driver applicant"
                                    }
                                />
                            </div>
                        </div>

                        <div className="admin-application-section">
                            <h3>
                                Driving licence
                            </h3>

                            <div className="admin-application-fields">
                                <ApplicationField
                                    label="Licence Number"
                                    value={
                                        selected.licenseNumber
                                    }
                                />
                            </div>
                        </div>

                        <div className="admin-application-section">
                            <h3>
                                Vehicle information
                            </h3>

                            <div className="admin-application-fields">
                                <ApplicationField
                                    label="Make"
                                    value={
                                        selected.vehicleMake
                                    }
                                />

                                <ApplicationField
                                    label="Model"
                                    value={
                                        selected.vehicleModel
                                    }
                                />

                                <ApplicationField
                                    label="Year"
                                    value={
                                        selected.vehicleYear
                                    }
                                />

                                <ApplicationField
                                    label="Color"
                                    value={
                                        selected.vehicleColor
                                    }
                                />

                                <ApplicationField
                                    label="Plate Number"
                                    value={
                                        selected.vehiclePlateNumber
                                    }
                                />

                                <ApplicationField
                                    label="Capacity"
                                    value={
                                        selected.vehicleCapacity
                                    }
                                />
                            </div>
                        </div>

                        {selected.corrections
                            ?.length > 0 && (
                            <div className="admin-application-section">
                                <h3>
                                    Recorded corrections
                                </h3>

                                {
                                    selected.corrections.map(
                                        (
                                            correction
                                        ) => (
                                            <div
                                                className="admin-correction-row"
                                                key={
                                                    correction.fieldName
                                                }
                                            >
                                                <strong>
                                                    {
                                                        displayFilter(
                                                            correction.fieldName
                                                        )
                                                    }
                                                </strong>

                                                <p>
                                                    {
                                                        correction.instruction
                                                    }
                                                </p>
                                            </div>
                                        )
                                    )
                                }
                            </div>
                        )}

                        {selected.canApprove &&
                            selected.canDecline && (
                                <div className="admin-application-actions">
                                    <button
                                        className="admin-approve-button"
                                        onClick={
                                            approveApplication
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        {
                                            actionLoading
                                                ? "Processing..."
                                                : "Approve Application"
                                        }
                                    </button>

                                    <button
                                        className="admin-decline-button"
                                        onClick={() =>
                                            setDeclineOpen(
                                                (
                                                    open
                                                ) =>
                                                    !open
                                            )
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        Decline Application
                                    </button>
                                </div>
                            )}

                        {declineOpen && (
                            <div className="admin-decline-form">
                                <h3>
                                    Decline and request
                                    corrections
                                </h3>

                                <p>
                                    Select every incorrect
                                    field and provide a
                                    separate instruction.
                                </p>

                                <textarea
                                    className="admin-decline-summary"
                                    rows="3"
                                    maxLength={1000}
                                    placeholder="Overall explanation for the applicant"
                                    value={
                                        reviewSummary
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setReviewSummary(
                                            event.target.value
                                        )
                                    }
                                />

                                {CORRECTABLE_FIELDS.map(
                                    (field) => {
                                        const correction =
                                            corrections[
                                                field.key
                                            ];

                                        return (
                                            <div
                                                className="admin-correction-row"
                                                key={
                                                    field.key
                                                }
                                            >
                                                <label className="admin-correction-selector">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            correction.selected
                                                        }
                                                        onChange={() =>
                                                            toggleCorrection(
                                                                field.key
                                                            )
                                                        }
                                                    />

                                                    {
                                                        field.label
                                                    }
                                                </label>

                                                {correction.selected && (
                                                    <textarea
                                                        className="admin-correction-instruction"
                                                        rows="2"
                                                        maxLength={1000}
                                                        placeholder={
                                                            `How should the applicant correct ${field.label}?`
                                                        }
                                                        value={
                                                            correction.instruction
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateInstruction(
                                                                field.key,
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                        );
                                    }
                                )}

                                <div className="admin-suspension-box">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                suspendAccount
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSuspendAccount(
                                                    event.target.checked
                                                )
                                            }
                                        />

                                        Suspend the entire
                                        account for suspected
                                        fraudulent or illegal
                                        information
                                    </label>

                                    <p className="admin-suspension-warning">
                                        This blocks both
                                        Passenger and Driver
                                        modes. Do not use it
                                        for ordinary mistakes.
                                    </p>

                                    {suspendAccount && (
                                        <textarea
                                            className="admin-suspension-reason"
                                            rows="3"
                                            maxLength={500}
                                            placeholder="Mandatory suspension reason"
                                            value={
                                                suspensionReason
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSuspensionReason(
                                                    event.target.value
                                                )
                                            }
                                        />
                                    )}
                                </div>

                                <button
                                    className="admin-decline-submit"
                                    onClick={
                                        declineApplication
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    {
                                        actionLoading
                                            ? "Submitting Decision..."
                                            : "Confirm Decline"
                                    }
                                </button>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}

function ApplicationField({
    label,
    value,
}) {
    return (
        <div className="admin-application-field">
            <span>{label}</span>

            <strong>
                {
                    value === null ||
                    value === undefined ||
                    value === ""
                        ? "Not provided"
                        : value
                }
            </strong>
        </div>
    );
}

export default AdminDriverApplications;
