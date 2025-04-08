document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("api-request-form")) {
        initApiDemoPage();
    }
});

function initApiDemoPage() {
    const apiForm = document.getElementById("api-request-form");
    const resultsDiv = document.getElementById("api-results");
    const limitStatusDiv = document.getElementById("rate-limit-status");

    updateRateLimitStatus();

    apiForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const query = document.getElementById("api-query").value.trim();
        if (!query) return;

        try {
            const response = await fetch("/api/external-data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "API request failed");
            }

            const { data, limits } = await response.json();
            displayResults(data);
            updateRateLimitDisplay(limits);
        } catch (error) {
            showError(error.message);
        }
    });

    async function updateRateLimitStatus() {
        try {
            const response = await fetch("/api/rate-limit-status");
            if (!response.ok) throw new Error("Failed to get rate limits");

            const { get, post } = await response.json();
            updateRateLimitDisplay({ get, post });
        } catch (error) {
            limitStatusDiv.innerHTML = `
                <div class="alert alert-danger">
                    Error loading rate limits: ${error.message}
                </div>
            `;
        }
    }

    function updateRateLimitDisplay(limits) {
        limitStatusDiv.innerHTML = `
            <p><strong>GET Requests:</strong> ${limits.get.count}/${limits.get.remaining} remaining</p>
            <p><strong>POST Requests:</strong> ${limits.post.count}/${limits.post.remaining} remaining</p>
            <p class="text-muted">Limits reset every 15 minutes</p>
        `;
    }

    function displayResults(data) {
        resultsDiv.innerHTML = `
            <div class="card">
                <div class="card-header">
                    API Response
                </div>
                <div class="card-body">
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                </div>
            </div>
        `;
    }

    function showError(message) {
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                ${message}
            </div>
        `;
    }
}
