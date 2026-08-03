import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    CarFront,
    CheckCircle2,
    Clock3,
    LogOut,
    MapPin,
    RefreshCw,
    Wallet,
} from "lucide-react";
import "./DriverApplicationStatus.css";

const API = "http://localhost:8080";

function DriverApplicationStatus() {

    const navigate = useNavigate();

    const [application, setApplication] =
        useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] = useState("");

    const applicantToken =
        localStorage.getItem("applicantToken");

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

    const clearAuthentication = () => {

        [
            "activeMode",
            "applicantToken",
            "applicationStatus",
            "canGoOnline",
            "walletEnabled",
            "passengerId",
            "driverId",
            "userId",
            "isAdmin",
            "adminToken",
            "fullName",
        ].forEach((key) => {
            localStorage.removeItem(key);
        });

    };

    const activateApprovedDriver = (data) => {

        localStorage.setItem(
            "activeMode",
            "DRIVER"
        );

        localStorage.setItem(
            "driverId",
            String(data.driverId)
        );

        localStorage.setItem(
            "userId",
            String(data.userId)
        );

        localStorage.setItem(
            "canGoOnline",
            "true"
        );

        localStorage.setItem(
            "walletEnabled",
            "true"
        );

        localStorage.removeItem("applicantToken");
        localStorage.removeItem("applicationStatus");

        navigate(
            "/driver-dashboard",
            {
                replace: true,
            }
        );

    };

    const loadStatus = async (showRefresh = false) => {

        if (!applicantToken) {
            clearAuthentication();

            navigate(
                "/driver-phone",
                {
                    replace: true,
                }
            );

            return;
        }

        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {

            const response = await fetch(
                `${API}/driver-registration/application/status`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${applicantToken}`,
                    },
                }
            );

            const data = await readResponse(response);

            if (response.status === 401) {
                clearAuthentication();

                navigate(
                    "/driver-phone",
                    {
                        replace: true,
                    }
                );

                return;
            }

            if (!response.ok || !data.success) {
                setError(
                    data.message
                    || data.details
                    || "Unable to load application status."
                );
                return;
            }

            if (
                data.applicationStatus === "APPROVED"
                && data.driverId
            ) {
                activateApprovedDriver(data);
                return;
            }

            setApplication(data);

            localStorage.setItem(
                "applicationStatus",
                data.applicationStatus
            );

        } catch (requestError) {

            console.error(requestError);

            setError(
                "Unable to connect to the application server."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const handleLogout = async () => {

        try {

            if (applicantToken) {
                await fetch(
                    `${API}/driver-registration/logout`,
                    {
                        method: "POST",
                        headers: {
                            Authorization:
                                `Bearer ${applicantToken}`,
                        },
                    }
                );
            }

        } catch (requestError) {

            console.error(requestError);

        } finally {

            clearAuthentication();

            navigate(
                "/role",
                {
                    replace: true,
                }
            );

        }
    };

    const handleCorrections = () => {

        navigate(
            "/driver-signup-corrections",
            {
                state: {
                    applicationId:
                        application?.applicationId,
                },
            }
        );

    };

    const formatDate = (value) => {

        if (!value) {
            return "Not available";
        }

        return new Date(value).toLocaleString();

    };

    const formatFieldName = (fieldName) => {

        return fieldName
            .replaceAll("_", " ")
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );

    };

    if (loading) {

        return (
            <div className="application-dashboard">
                <div className="application-loading">
                    Loading your driver account...
                </div>
            </div>
        );

    }

    if (error && !application) {

        return (
            <div className="application-dashboard">

                <div className="application-error">

                    <p>{error}</p>

                    <button
                        className="application-header-button"
                        onClick={() => loadStatus()}
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );

    }

    const status =
        application?.applicationStatus
        || "PENDING_REVIEW";

    const isPending =
        status === "PENDING_REVIEW";

    const isDeclined =
        status === "DECLINED";

    const bannerClass = isDeclined
        ? "declined"
        : isPending
            ? "pending"
            : "approved";

    return (

        <div className="application-dashboard">

            <header className="application-dashboard-header">

                <div className="application-dashboard-brand">
                    <span className="velo">VEL</span>
                    <span className="wheel"></span>
                    <span className="city">CITY</span>
                </div>

                <div className="application-header-actions">

                    <button
                        className="application-header-button"
                        onClick={() => loadStatus(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw size={18} />
                        {
                            refreshing
                                ? "Refreshing"
                                : "Refresh"
                        }
                    </button>

                    <button
                        className="application-header-button logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        Logout
                    </button>

                </div>

            </header>

            <main className="application-dashboard-content">

                <section className="application-welcome">

                    <h1>Driver Mode</h1>

                    <p>
                        Your account is available with
                        temporary restrictions during review.
                    </p>

                </section>

                <section
                    className={
                        `application-status-banner ${bannerClass}`
                    }
                >

                    {
                        isDeclined
                            ? <AlertTriangle size={36} />
                            : isPending
                                ? <Clock3 size={36} />
                                : <CheckCircle2 size={36} />
                    }

                    <div>

                        <h2>
                            {
                                isDeclined
                                    ? "Application Declined"
                                    : isPending
                                        ? "Application Under Review"
                                        : "Application Approved"
                            }
                        </h2>

                        <p>
                            {application?.message}
                        </p>

                        {
                            application?.reviewSummary && (
                                <p>
                                    {application.reviewSummary}
                                </p>
                            )
                        }

                        <div className="application-status-meta">
                            Attempt #
                            {application?.attemptNumber}
                            {" · "}
                            Submitted{" "}
                            {formatDate(
                                application?.submittedAt
                            )}
                        </div>

                    </div>

                </section>

                {error && (
                    <p className="application-error">
                        {error}
                    </p>
                )}

                <section className="application-feature-grid">

                    <article className="application-feature-card">

                        <div className="application-feature-icon">
                            <MapPin size={27} />
                        </div>

                        <h3>Online Status</h3>

                        <p>
                            Going Online becomes available
                            after admin approval.
                        </p>

                        <div className="application-locked-control">
                            <button
                                className="application-disabled-button"
                                disabled
                            >
                                Online Disabled
                            </button>
                        </div>

                    </article>

                    <article className="application-feature-card">

                        <div className="application-feature-icon">
                            <Wallet size={27} />
                        </div>

                        <h3>Driver Wallet</h3>

                        <p>
                            Your zero-balance wallet will be
                            created after approval.
                        </p>

                        <div className="application-locked-control">
                            <button
                                className="application-disabled-button"
                                disabled
                            >
                                Wallet Locked
                            </button>
                        </div>

                    </article>

                    <article className="application-feature-card">

                        <div className="application-feature-icon">
                            <CarFront size={27} />
                        </div>

                        <h3>Ride Offers</h3>

                        <p>
                            Pending applicants cannot view,
                            submit, or accept ride offers.
                        </p>

                        <div className="application-locked-control">
                            <button
                                className="application-disabled-button"
                                disabled
                            >
                                Offers Locked
                            </button>
                        </div>

                    </article>

                </section>

                {
                    isDeclined && (
                        <section className="application-corrections">

                            <h2>Required corrections</h2>

                            <p className="application-corrections-intro">
                                Correct the marked fields and
                                submit a new application attempt.
                            </p>

                            {
                                application.corrections?.map(
                                    (correction) => (
                                        <div
                                            className="application-correction-item"
                                            key={correction.fieldName}
                                        >
                                            <strong>
                                                {
                                                    formatFieldName(
                                                        correction.fieldName
                                                    )
                                                }
                                            </strong>

                                            <p>
                                                {correction.instruction}
                                            </p>
                                        </div>
                                    )
                                )
                            }

                            <button
                                className="application-correct-button"
                                onClick={handleCorrections}
                            >
                                Correct Application
                            </button>

                        </section>
                    )
                }

            </main>

        </div>

    );

}

export default DriverApplicationStatus;