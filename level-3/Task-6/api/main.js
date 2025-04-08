document.addEventListener("DOMContentLoaded", function () {
  // Registration Form Handling
  const registrationForm = document.getElementById("registrationForm");
  if (registrationForm) {
    registrationForm.addEventListener("submit", function (e) {
      e.preventDefault();

      let isValid = true;
      const formData = new FormData(registrationForm);
      const data = Object.fromEntries(formData.entries());

      // Reset validation
      document.querySelectorAll(".is-invalid").forEach((el) => {
        el.classList.remove("is-invalid");
      });

      // Name validation
      if (data.name.length < 2) {
        isValid = false;
        document.getElementById("name").classList.add("is-invalid");
      }

      // Email validation
      if (!/^\S+@\S+\.\S+$/.test(data.email)) {
        isValid = false;
        document.getElementById("email").classList.add("is-invalid");
      }

      // Password validation
      if (data.password.length < 6) {
        isValid = false;
        document.getElementById("password").classList.add("is-invalid");
      }

      if (!isValid) {
        const firstInvalid = document.querySelector(".is-invalid");
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      // If client-side validation passes, submit the form
      registrationForm.submit();
    });

    // Remove invalid class when user starts typing
    document.querySelectorAll(".form-control").forEach((input) => {
      input.addEventListener("input", function () {
        this.classList.remove("is-invalid");
      });
    });
  }

  // Login Form Handling
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(loginForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(data).toString(),
        });

        if (response.redirected) {
          window.location.href = response.url;
        } else {
          const result = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(result, "text/html");
          const errorElement = doc.querySelector(".alert-danger");

          if (errorElement) {
            const errorContainer = document.createElement("div");
            errorContainer.innerHTML = errorElement.outerHTML;
            const existingError = loginForm.querySelector(".alert-danger");
            if (existingError) {
              existingError.replaceWith(errorContainer.firstChild);
            } else {
              loginForm.prepend(errorContainer.firstChild);
            }
          }
        }
      } catch (error) {
        console.error("Login error:", error);
        const errorDiv = document.createElement("div");
        errorDiv.className = "alert alert-danger";
        errorDiv.textContent = "An error occurred. Please try again.";
        loginForm.prepend(errorDiv);
      }
    });
  }
});
