import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PassengerHamburgerMenu from "../components/PassengerHamburgerMenu";
import "./PassengerFeedback.css";

function PassengerFeedback() {
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [category, setCategory] =
    useState("General Feedback");
  const [feedback, setFeedback] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }

    if (feedback.trim().length < 10) {
      setError(
        "Please write at least 10 characters of feedback."
      );
      return;
    }

    let savedFeedback = [];

    try {
      const storedFeedback = localStorage.getItem(
        "passengerFeedback"
      );

      savedFeedback = storedFeedback
        ? JSON.parse(storedFeedback)
        : [];
    } catch {
      savedFeedback = [];
    }

    const feedbackEntry = {
      id: Date.now(),
      passengerId:
        localStorage.getItem("passengerId") || null,
      passengerName:
        localStorage.getItem("passengerName") ||
        "Passenger",
      category,
      rating,
      message: feedback.trim(),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "passengerFeedback",
      JSON.stringify([...savedFeedback, feedbackEntry])
    );

    setRating(0);
    setCategory("General Feedback");
    setFeedback("");
    setSuccess("Thank you. Your feedback was submitted.");
  };

  return (
    <div className="passenger-feedback-page">
      <header className="passenger-feedback-header">
        <h2>VELOCITY</h2>
        <PassengerHamburgerMenu />
      </header>

      <main className="passenger-feedback-content">
        <button
          type="button"
          className="feedback-back-button"
          onClick={() => navigate("/passenger-dashboard")}
        >
          ← Back to dashboard
        </button>

        <section className="feedback-title">
          <p>Help us improve Velocity</p>
          <h1>Feedback</h1>
        </section>

        <form
          className="passenger-feedback-card"
          onSubmit={handleSubmit}
        >
          <div>
            <label>How was your experience?</label>

            <div className="feedback-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={
                    star <= rating
                      ? "feedback-star selected"
                      : "feedback-star"
                  }
                  onClick={() => setRating(star)}
                  aria-label={`${star} star rating`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="feedback-field">
            <label htmlFor="feedback-category">
              Feedback category
            </label>

            <select
              id="feedback-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option>General Feedback</option>
              <option>Ride Experience</option>
              <option>Driver Experience</option>
              <option>Passenger App</option>
              <option>Pricing</option>
              <option>Safety Concern</option>
              <option>Technical Problem</option>
            </select>
          </div>

          <div className="feedback-field">
            <label htmlFor="feedback-message">
              Tell us more
            </label>

            <textarea
              id="feedback-message"
              rows="6"
              maxLength="1000"
              placeholder="Describe your experience or suggestion..."
              value={feedback}
              onChange={(event) =>
                setFeedback(event.target.value)
              }
            />

            <small>{feedback.length}/1000</small>
          </div>

          {error && (
            <p className="feedback-error">{error}</p>
          )}

          {success && (
            <p className="feedback-success">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="submit-feedback-button"
          >
            Submit Feedback
          </button>
        </form>
      </main>
    </div>
  );
}

export default PassengerFeedback;