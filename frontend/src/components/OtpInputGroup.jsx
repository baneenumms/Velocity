import { useEffect, useRef } from "react";

const OTP_LENGTH = 6;

function OtpInputGroup({
  value,
  onChange,
  onSubmit,
  disabled = false,
  label = "Verification code",
}) {
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const applyFullCode = (rawValue) => {
    const digits = rawValue
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!digits) {
      return false;
    }

    const nextValue = Array(OTP_LENGTH).fill("");

    digits.split("").forEach((digit, index) => {
      nextValue[index] = digit;
    });

    onChange(nextValue);

    const focusIndex = Math.min(
      digits.length,
      OTP_LENGTH - 1
    );

    window.setTimeout(() => {
      inputs.current[focusIndex]?.focus();
    }, 0);

    return true;
  };

  const handleChange = (event, index) => {
    const rawValue = event.target.value;
    const digits = rawValue.replace(/\D/g, "");

    if (digits.length > 1) {
      applyFullCode(digits);
      return;
    }

    if (rawValue && !digits) {
      return;
    }

    const nextValue = [...value];
    nextValue[index] = digits;
    onChange(nextValue);

    if (digits && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const clipboardValue = event.clipboardData.getData("text");

    if (applyFullCode(clipboardValue)) {
      event.preventDefault();
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit?.();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
      return;
    }

    if (
      event.key === "Backspace" &&
      value[index] === "" &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <div
      className="otp-container"
      role="group"
      aria-label={label}
      onPaste={handlePaste}
    >
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          className="otp-box"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={index === 0 ? OTP_LENGTH : 1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          onChange={(event) => handleChange(event, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        />
      ))}
    </div>
  );
}

export default OtpInputGroup;
