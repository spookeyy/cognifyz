const registrationForm = document.getElementById("registrationForm");
const submissionsList = document.querySelector(".list-group");
const apiStatus = document.createElement("div");
apiStatus.className = "alert alert-info mb-3";
document.querySelector(".card-body").prepend(apiStatus);

const API_BASE_URL = "http://localhost:3000/api";

async function fetchSubmissions() {
  try {
    apiStatus.innerHTML =
      '<i class="fas fa-sync-alt fa-spin me-2"></i> Loading submissions...';
    const response = await fetch(`${API_BASE_URL}/submissions`);
    if (!response.ok) throw new Error("Failed to fetch submissions");

    const submissions = await response.json();
    renderSubmissions(submissions);
    apiStatus.innerHTML = `<i class="fas fa-check-circle me-2"></i> Loaded ${submissions.length} submissions`;
    setTimeout(() => apiStatus.classList.add("fade-out"), 3000);
  } catch (error) {
    console.error("Error:", error);
    apiStatus.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${error.message}`;
    apiStatus.className = "alert alert-danger mb-3";
  }
}

function renderSubmissions(submissions) {
  submissionsList.innerHTML = "";
  submissions
    .slice()
    .reverse()
    .slice(0, 5)
    .forEach((sub) => {
      const submissionItem = document.createElement("div");
      submissionItem.className = "list-group-item submission-item";
      submissionItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${sub.name}</h6>
                <small class="text-muted">${new Date(
                  sub.createdAt
                ).toLocaleDateString()}</small>
            </div>
            <small class="text-muted">${sub.email}</small>
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${
                  sub.id
                }">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${
                  sub.id
                }">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
      submissionsList.appendChild(submissionItem);
    });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", handleEdit);
  });
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", handleDelete);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
  };

  const errors = {};
  if (formData.name.length < 2)
    errors.name = "Name must be at least 2 characters";
  if (!/^\S+@\S+\.\S+$/.test(formData.email))
    errors.email = "Please enter a valid email";
  if (formData.password.length < 6)
    errors.password = "Password must be at least 6 characters";

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) => {
      const input = document.getElementById(field);
      input.classList.add("is-invalid");
      const feedback = input.nextElementSibling;
      if (feedback && feedback.classList.contains("invalid-feedback")) {
        feedback.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i> ${message}`;
      }
    });
    return;
  }

  try {
    const mode = registrationForm.dataset.mode || "create";
    const id = registrationForm.dataset.id || "";
    const url =
      mode === "update"
        ? `${API_BASE_URL}/submissions/${id}`
        : `${API_BASE_URL}/submissions`;
    const method = mode === "update" ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors || "Failed to submit form");
    }

    const successAlert = document.createElement("div");
    successAlert.className = "alert alert-success success-alert";
    successAlert.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${
      mode === "update" ? "Updated" : "Registration"
    } successful!`;
    registrationForm.prepend(successAlert);

    registrationForm.reset();
    registrationForm.dataset.mode = "create";
    registrationForm.dataset.id = "";
    registrationForm.querySelector('button[type="submit"]').innerHTML =
      '<i class="fas fa-user-plus me-2"></i> Register Now';

    await fetchSubmissions();

    setTimeout(() => {
      successAlert.classList.add("fade-out");
      setTimeout(() => successAlert.remove(), 500);
    }, 5000);
  } catch (error) {
    console.error("Error:", error);
    apiStatus.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${error.message}`;
    apiStatus.className = "alert alert-danger mb-3";
  }
}

async function handleEdit(e) {
  const id = e.target.closest(".edit-btn").dataset.id;
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}`);
    if (!response.ok) throw new Error("Failed to fetch submission");

    const submission = await response.json();

    document.getElementById("name").value = submission.name;
    document.getElementById("email").value = submission.email;
    document.getElementById("password").value = "";

    registrationForm.dataset.mode = "update";
    registrationForm.dataset.id = id;

    const submitBtn = registrationForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save me-2"></i> Update Submission';

    registrationForm.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error:", error);
    apiStatus.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${error.message}`;
    apiStatus.className = "alert alert-danger mb-3";
  }
}

async function handleDelete(e) {
  if (!confirm("Are you sure you want to delete this submission?")) return;

  const id = e.target.closest(".delete-btn").dataset.id;
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete submission");

    await fetchSubmissions();

    apiStatus.innerHTML = `<i class="fas fa-check-circle me-2"></i> Submission deleted successfully`;
    apiStatus.className = "alert alert-success mb-3";
    setTimeout(() => apiStatus.classList.add("fade-out"), 3000);
  } catch (error) {
    console.error("Error:", error);
    apiStatus.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${error.message}`;
    apiStatus.className = "alert alert-danger mb-3";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  registrationForm.addEventListener("submit", handleFormSubmit);

  document.querySelectorAll(".form-control").forEach((input) => {
    input.addEventListener("input", function () {
      this.classList.remove("is-invalid");
    });
  });

  fetchSubmissions();
});

const style = document.createElement("style");
style.textContent = `
    .fade-out {
        opacity: 0;
        transition: opacity 0.5s ease-out;
    }
`;
document.head.appendChild(style);
