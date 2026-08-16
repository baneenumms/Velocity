import DriverHamburgerMenu from "./HamburgerMenu";
import PassengerHamburgerMenu from "./PassengerHamburgerMenu";
import VelocityHomeButton from "./VelocityHomeButton";

import "./AuthenticatedAppHeader.css";

function AuthenticatedAppHeader({
  mode,
  homeOnly = false,
}) {
  const normalizedMode = String(mode || "")
    .trim()
    .toUpperCase();

  const Menu =
    normalizedMode === "DRIVER"
      ? DriverHamburgerMenu
      : PassengerHamburgerMenu;

  return (
    <header
      className={
        `velocity-authenticated-header ${
          homeOnly ? "home-only" : ""
        }`
      }
    >
      <VelocityHomeButton mode={normalizedMode} />

      {!homeOnly && <Menu />}
    </header>
  );
}

export default AuthenticatedAppHeader;
