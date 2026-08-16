const APPLICANT_KEYS = [
  "activeMode",
  "applicantToken",
  "userId",
  "applicationStatus",
  "canGoOnline",
  "walletEnabled",
  "canViewRideOffers",
];

export function getApplicantToken() {
  return (
    sessionStorage.getItem("applicantToken") ||
    localStorage.getItem("applicantToken")
  );
}

export function clearApplicantSession() {
  APPLICANT_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

export function saveApplicantSession(data) {
  clearApplicantSession();

  const values = {
    activeMode: "DRIVER_APPLICANT",
    applicantToken: data.applicantToken,
    userId: data.userId,
    applicationStatus: data.applicationStatus,
    canGoOnline: data.canGoOnline,
    walletEnabled: data.walletEnabled,
    canViewRideOffers: data.canViewRideOffers,
  };

  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      sessionStorage.setItem(key, String(value));
    }
  });
}

export function promoteApprovedDriver(data) {
  if (!data.sessionToken || !data.driverId || !data.userId) {
    throw new Error("Approved driver session was not created.");
  }

  clearApplicantSession();

  sessionStorage.setItem(
    "velocitySession",
    JSON.stringify({
      token: data.sessionToken,
      userId: data.userId,
      activeMode: data.activeMode || "DRIVER",
      driverId: data.driverId,
      expiresAt: data.sessionExpiresAt,
    })
  );

  sessionStorage.setItem("activeMode", "DRIVER");
  sessionStorage.setItem("driverId", String(data.driverId));
  sessionStorage.setItem("userId", String(data.userId));
  sessionStorage.setItem("canGoOnline", "true");
  sessionStorage.setItem("walletEnabled", "true");
  sessionStorage.setItem("canViewRideOffers", "true");
}
