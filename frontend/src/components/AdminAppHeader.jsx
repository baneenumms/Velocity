import {
  useEffect,
} from "react";

import AdminHamburgerMenu from "./AdminHamburgerMenu";
import VelocityHomeButton from "./VelocityHomeButton";

import "./AdminAppHeader.css";

function AdminAppHeader() {
  useEffect(() => {
    sessionStorage.setItem(
      "activeMode",
      "ADMIN"
    );

    localStorage.setItem(
      "activeMode",
      "ADMIN"
    );
  }, []);

  return (
    <header className="admin-app-header">
      <div className="admin-app-header-brand">
        <VelocityHomeButton mode="ADMIN" />

        <span className="admin-mode-badge">
          ADMIN
        </span>
      </div>

      <AdminHamburgerMenu />
    </header>
  );
}

export default AdminAppHeader;
