import { useState } from "react";
import { MessageSquareHeart, ShieldCheck } from "lucide-react";
import "./PassengerFeedback.css";

function PassengerFeedback() {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("General Feedback");
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
      setError("Please write at least 10 characters of feedback.");
      return;
    }

    let savedFeedback = [];

    try {
      const storedFeedback = localStorage.getItem("passengerFeedback");
      savedFeedback = storedFeedback ? JSON.parse(storedFeedback) : [];
    } catch {
      savedFeedback = [];
    }

    const feedbackEntry = {
      id: Date.now(),
      passengerId: sessionStorage.getItem("passengerId") || null,
      passengerName: sessionStorage.getItem("passengerName") || "Passenger",
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
      <main className="passenger-feedback-content">
        <section className="passenger-feedback-title">
          <p>Help us improve Velocity</p>
          <h1>Feedback</h1>
        </section>

        <form className="passenger-feedback-card" onSubmit={handleSubmit}>
          <header className="passenger-feedback-card-header">
            <div className="passenger-feedback-header-icon" aria-hidden="true">
              <MessageSquareHeart size={27} />
            </div>
            <div>
              <span>Passenger experience</span>
              <h2>Tell us what you think</h2>
              <p>
                Your feedback is private and helps the Velocity team review the
                passenger experience.
              </p>
            </div>
          </header>

          <div className="passenger-feedback-form-grid">
            <fieldset className="passenger-feedback-rating">
              <legend>How was your experience?</legend>
              <div className="passenger-feedback-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={star <= rating ? "selected" : ""}
                    onClick={() => {
                      setRating(star);
                      setError("");
                    }}
                    aria-label={`${star} star rating`}
                    aria-pressed={star <= rating}
                  >
                    ★
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="passenger-feedback-field">
              <span>Feedback category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>General Feedback</option>
                <option>Ride Experience</option>
                <option>Driver Experience</option>
                <option>Passenger App</option>
                <option>Pricing</option>
                <option>Safety Concern</option>
                <option>Technical Problem</option>
              </select>
            </label>

            <label className="passenger-feedback-field passenger-feedback-message-field">
              <span>Tell us more</span>
              <textarea
                rows="6"
                maxLength="1000"
                placeholder="Describe your experience or suggestion..."
                value={feedback}
                onChange={(event) => {
                  setFeedback(event.target.value);
                  setError("");
                  setSuccess("");
                }}
              />
              <small>{feedback.length}/1000</small>
            </label>
          </div>

          <div className="passenger-feedback-privacy-note">
            <ShieldCheck size={20} />
            <span>
              Do not include passwords, verification codes, or payment credentials.
            </span>
          </div>

          {error && <p className="passenger-feedback-error">{error}</p>}
          {success && <p className="passenger-feedback-success">{success}</p>}

          <button type="submit" className="passenger-feedback-submit">
            Submit Feedback
          </button>
        </form>
      </main>
    </div>
  );
}

export default PassengerFeedback;