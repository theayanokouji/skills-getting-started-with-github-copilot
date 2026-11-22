document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.options.length = 1;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("strong");
        participantsHeading.textContent = "Participants:";
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        if (details.participants.length > 0) {
          details.participants.forEach((participant) => {
            const listItem = document.createElement("li");
            listItem.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.textContent = participant;
            listItem.appendChild(participantEmail);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove-button";
            removeButton.setAttribute(
              "aria-label",
              `Unregister ${participant} from ${name}`
            );
            removeButton.title = `Unregister ${participant}`;

            const deleteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            deleteIcon.setAttribute("viewBox", "0 0 24 24");
            deleteIcon.setAttribute("aria-hidden", "true");

            const deletePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            deletePath.setAttribute("d", "M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3");
            deleteIcon.appendChild(deletePath);
            removeButton.appendChild(deleteIcon);

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;

              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Failed to unregister participant");
                }

                showMessage(result.message, "success");
                await fetchActivities();
              } catch (error) {
                showMessage(
                  error instanceof Error ? error.message : "Failed to unregister participant",
                  "error"
                );
                console.error("Error unregistering participant:", error);
                removeButton.disabled = false;
              }
            });

            listItem.appendChild(removeButton);
            participantsList.appendChild(listItem);
          });
        } else {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "no-participants";
          emptyMessage.textContent = "No participants yet";
          participantsList.appendChild(emptyMessage);
        }

        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }

    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
