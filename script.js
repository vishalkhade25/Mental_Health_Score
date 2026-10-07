// ============================================================
// Mental Health Score - Frontend Logic
// Connects to the existing FastAPI backend: POST /predict
// ============================================================

const API_URL = "https://mental-health-score-api-xmzc.onrender.com";

// Gauge circle circumference
// r = 52 → 2 × PI × 52 ≈ 326.73
const GAUGE_CIRCUMFERENCE = 326.73;


// ============================================================
// DOM REFERENCES
// ============================================================

const form = document.getElementById("predict-form");

const submitBtn = document.getElementById("submit-btn");
const btnLabel = document.getElementById("btn-label");

const apiError = document.getElementById("api-error");

const resultSection = document.getElementById("result");

const resetBtn = document.getElementById("reset-btn");


// ============================================================
// VALIDATION RULES
// ============================================================

const FIELD_RULES = {

  age: {
    label: "Age",
    kind: "int",
    min: 10,
    max: 100
  },

  gender: {
    label: "Gender",
    kind: "select"
  },

  country: {
    label: "Country",
    kind: "select"
  },

  academic_level: {
    label: "Academic level",
    kind: "select"
  },

  most_used_platform: {
    label: "Most used platform",
    kind: "select"
  },

  purpose_of_use: {
    label: "Purpose of use",
    kind: "select"
  },

  avg_daily_usage_hours: {
    label: "Daily usage",
    kind: "float",
    min: 0,
    max: 24
  },

  daily_unlocks: {
    label: "Daily unlocks",
    kind: "int",
    min: 0
  },

  study_hours: {
    label: "Study hours",
    kind: "float",
    min: 0,
    max: 24
  },

  physical_activity_hours: {
    label: "Physical activity hours",
    kind: "float",
    min: 0,
    max: 24
  },

  sleep_hours_per_night: {
    label: "Sleep hours",
    kind: "float",
    min: 0,
    max: 24
  },

  stress_level: {
    label: "Stress level",
    kind: "select"
  }
};


// ============================================================
// FIELD ERROR HANDLING
// ============================================================

function setFieldError(name, message) {

  const input = document.getElementById(name);
  const errorEl = document.getElementById(`${name}-error`);

  if (!input || !errorEl) return;

  errorEl.textContent = message;

  const field = input.closest(".field");

  if (field) {
    field.classList.toggle("invalid", Boolean(message));
  }

  input.setAttribute(
    "aria-invalid",
    message ? "true" : "false"
  );

  if (message) {
    input.setAttribute(
      "aria-describedby",
      `${name}-error`
    );
  } else {
    input.removeAttribute("aria-describedby");
  }
}


// ============================================================
// CLEAR ALL ERRORS
// ============================================================

function clearAllErrors() {

  Object.keys(FIELD_RULES).forEach((name) => {
    setFieldError(name, "");
  });

  apiError.hidden = true;
  apiError.textContent = "";
}


// ============================================================
// CHECK WHETHER ALL REQUIRED FIELDS ARE FILLED
// ============================================================

function updateSubmitButtonState() {

  const allFieldsFilled = Object.keys(FIELD_RULES).every((name) => {

    const input = document.getElementById(name);

    if (!input) return false;

    return input.value.trim() !== "";
  });

  /*
    Button is disabled until every field has a value.

    This is only the first check.
    Full validation still happens when the form is submitted.
  */

  submitBtn.disabled = !allFieldsFilled;
}


// ============================================================
// FULL FORM VALIDATION
// ============================================================

function validateForm() {

  let isValid = true;
  let firstInvalid = null;

  for (const [name, rule] of Object.entries(FIELD_RULES)) {

    const input = document.getElementById(name);

    if (!input) continue;

    const raw = input.value.trim();

    let message = "";


    // Required field check
    if (raw === "") {

      if (rule.kind === "select") {

        message =
          `Please select ${rule.label.toLowerCase()}.`;

      } else {

        message =
          `${rule.label} is required.`;
      }

    }


    // Numeric validation
    else if (rule.kind !== "select") {

      const value = Number(raw);


      // Invalid number
      if (Number.isNaN(value)) {

        message =
          `${rule.label} must be a valid number.`;
      }


      // Integer validation
      else if (
        rule.kind === "int" &&
        !Number.isInteger(value)
      ) {

        message =
          `${rule.label} must be a whole number.`;
      }


      // Minimum validation
      else if (
        rule.min !== undefined &&
        value < rule.min
      ) {

        message =
          rule.max !== undefined
            ? `${rule.label} must be between ${rule.min} and ${rule.max}.`
            : `${rule.label} must be ${rule.min} or greater.`;
      }


      // Maximum validation
      else if (
        rule.max !== undefined &&
        value > rule.max
      ) {

        message =
          `${rule.label} must be between ${rule.min} and ${rule.max}.`;
      }
    }


    // Show error
    setFieldError(name, message);


    // Track invalid fields
    if (message) {

      isValid = false;

      if (!firstInvalid) {
        firstInvalid = input;
      }
    }
  }


  // Focus first invalid field
  if (firstInvalid) {
    firstInvalid.focus();
  }


  return isValid;
}


// ============================================================
// COLLECT FORM DATA
// ============================================================

function getFormData() {

  const value = (id) => {
    return document.getElementById(id).value;
  };


  return {

    age:
      Number(value("age")),

    gender:
      value("gender"),

    country:
      value("country"),

    academic_level:
      value("academic_level"),

    most_used_platform:
      value("most_used_platform"),

    purpose_of_use:
      value("purpose_of_use"),

    avg_daily_usage_hours:
      Number(value("avg_daily_usage_hours")),

    daily_unlocks:
      Number(value("daily_unlocks")),

    study_hours:
      Number(value("study_hours")),

    physical_activity_hours:
      Number(value("physical_activity_hours")),

    sleep_hours_per_night:
      Number(value("sleep_hours_per_night")),

    stress_level:
      value("stress_level")
  };
}


// ============================================================
// CALL FASTAPI BACKEND
// ============================================================

async function predictMentalHealth(data) {

  const response = await fetch(API_URL, {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(data)
  });


  // FastAPI validation / server errors
  if (!response.ok) {

    let detail = "";

    try {

      const errBody =
        await response.json();

      console.error(
        "API error response:",
        errBody
      );

      if (typeof errBody.detail === "string") {
        detail = errBody.detail;
      }

    } catch (_) {

      // Response was not JSON
    }


    const error = new Error(
      detail ||
      `Server responded with status ${response.status}`
    );

    error.status = response.status;

    throw error;
  }


  // Successful response
  const result =
    await response.json();


  const score =
    result.predicted_mental_health_score;


  // Make sure score is valid
  if (
    typeof score !== "number" ||
    Number.isNaN(score)
  ) {

    throw new Error(
      "Unexpected response from the server."
    );
  }


  return score;
}


// ============================================================
// DISPLAY RESULT
// ============================================================

function displayResult(score) {

  /*
    IMPORTANT:

    The ML model score is 0–10.

    The gauge/bar visually requires a percentage,
    therefore:

    0  → 0%
    5  → 50%
    10 → 100%
  */

  const percent =
    Math.min(
      100,
      Math.max(
        0,
        (score / 10) * 100
      )
    );


  // Display actual score
  document.getElementById(
    "score-value"
  ).textContent = score.toFixed(2);


  // Update progress bar accessibility
  const bar =
    document.getElementById("score-bar");

  bar.setAttribute(
    "aria-valuenow",
    score.toFixed(2)
  );

  bar.setAttribute(
    "aria-valuemin",
    "0"
  );

  bar.setAttribute(
    "aria-valuemax",
    "10"
  );


  // Show result section
  resultSection.hidden = false;


  // Gauge
  const gaugeFill =
    document.getElementById("gauge-fill");


  // Progress bar
  const barFill =
    document.getElementById("bar-fill");


  // Start animation from zero
  gaugeFill.style.strokeDashoffset =
    GAUGE_CIRCUMFERENCE;

  barFill.style.width = "0%";


  // Animate to actual score
  requestAnimationFrame(() => {

    requestAnimationFrame(() => {

      gaugeFill.style.strokeDashoffset =
        GAUGE_CIRCUMFERENCE *
        (1 - percent / 100);

      barFill.style.width =
        `${percent}%`;
    });
  });


  // Update score message
  const scoreMessage =
    document.querySelector(".score-message");


  if (scoreMessage) {

    let title = "";
    let description = "";


    if (score >= 7) {

      title = "Looking Good!";
      description =
        "Your predicted score indicates a relatively positive mental health level.";

    } else if (score >= 4) {

      title = "Moderate Level";
      description =
        "Your predicted score falls in the moderate range. Maintaining healthy habits can be beneficial.";

    } else {

      title = "Needs Attention";
      description =
        "Your predicted score is relatively low. Consider paying attention to sleep, activity and stress management.";
    }


    scoreMessage.innerHTML = `
      <strong>${title}</strong>
      <p>${description}</p>
    `;
  }


  // Scroll result into view on smaller screens
  if (window.innerWidth <= 900) {

    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}


// ============================================================
// SHOW API / NETWORK ERROR
// ============================================================

function showError(message) {

  apiError.textContent = message;

  apiError.hidden = false;
}


// ============================================================
// RESET FORM
// ============================================================

function resetForm() {

  // Reset all inputs
  form.reset();


  // Clear validation errors
  clearAllErrors();


  // Hide result
  resultSection.hidden = true;


  // Reset gauge
  document.getElementById(
    "gauge-fill"
  ).style.strokeDashoffset =
    GAUGE_CIRCUMFERENCE;


  // Reset progress bar
  document.getElementById(
    "bar-fill"
  ).style.width = "0%";


  // Reset score text
  document.getElementById(
    "score-value"
  ).textContent = "0.00";


  // Reset score message
  const scoreMessage =
    document.querySelector(".score-message");


  if (scoreMessage) {

    scoreMessage.innerHTML = `
      <strong>Ready to calculate?</strong>
      <p>
        Complete all the required information to generate
        your personalized prediction.
      </p>
    `;
  }


  // Button should become disabled again
  updateSubmitButtonState();


  // Scroll to top
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  // Focus age field
  document.getElementById("age")
    .focus({
      preventScroll: true
    });
}


// ============================================================
// LOADING STATE
// ============================================================

function setLoading(isLoading) {

  submitBtn.disabled = isLoading;

  submitBtn.classList.toggle(
    "loading",
    isLoading
  );


  btnLabel.textContent =
    isLoading
      ? "Calculating..."
      : "Calculate Mental Health Score";
}


// ============================================================
// FORM SUBMIT
// ============================================================

form.addEventListener(
  "submit",
  async (event) => {

    // Prevent browser page reload
    event.preventDefault();


    // Clear previous errors
    clearAllErrors();


    // Hide previous result
    resultSection.hidden = true;


    // Full validation
    if (!validateForm()) {

      updateSubmitButtonState();

      return;
    }


    // Collect form data
    const data =
      getFormData();


    console.log(
      "Sending to /predict:",
      data
    );


    // Loading state
    setLoading(true);


    try {

      // Call FastAPI
      const score =
        await predictMentalHealth(data);


      console.log(
        "Predicted Mental Health Score:",
        score
      );


      // Display prediction
      displayResult(score);

    }


    catch (error) {

      console.error(
        "Prediction failed:",
        error
      );


      // Backend unreachable
      if (
        error instanceof TypeError
      ) {

        showError(
          "Unable to connect to the prediction server. " +
          "Please make sure FastAPI is running at " +
          "http://127.0.0.1:8000."
        );
      }


      // FastAPI validation error
      else if (
        error.status === 422
      ) {

        showError(
          "The server rejected some of the values. " +
          "Please check your inputs and try again."
        );
      }


      // Backend/server error
      else if (
        error.status >= 500
      ) {

        showError(
          "The prediction server ran into a problem. " +
          "Check the FastAPI terminal for details."
        );
      }


      // Other error
      else {

        showError(
          error.message ||
          "Something went wrong. Please try again."
        );
      }
    }


    finally {

      // Re-enable button depending on field state
      setLoading(false);

      updateSubmitButtonState();
    }
  }
);


// ============================================================
// LIVE FIELD VALIDATION / BUTTON STATE
// ============================================================

Object.keys(FIELD_RULES).forEach(
  (name) => {

    const el =
      document.getElementById(name);


    if (!el) return;


    // For text/number inputs
    el.addEventListener(
      "input",
      () => {

        setFieldError(name, "");

        updateSubmitButtonState();
      }
    );


    // For select elements
    el.addEventListener(
      "change",
      () => {

        setFieldError(name, "");

        updateSubmitButtonState();
      }
    );
  }
);


// ============================================================
// RESET BUTTON
// ============================================================

resetBtn.addEventListener(
  "click",
  resetForm
);


// ============================================================
// INITIAL STATE
// ============================================================

// Disable Calculate button initially
updateSubmitButtonState();