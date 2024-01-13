let persons = [];
let currentQuestionIndex = 0;
let questions = [];

// Function to initialize the questionnaire
function initializeQuestionnaire() {
  fetch("/persons")
    .then((response) => response.json())
    .then((data) => {
      persons = data;
    });

  fetchQuestions().then(() => {
    createProgressDots();
    displayQuestion();
  });
}

// Fetch questions and update the UI
function fetchQuestions() {
  return fetch("/questions")
    .then((response) => response.json())
    .then((data) => {
      questions = data;
    });
}

function updateProgress() {
  const dots = document.querySelectorAll(".progress-dot");
  let activeDotIndex = -1;
  dots.forEach((dot, index) => {
    if (index === currentQuestionIndex) {
      dot.classList.add("active-dot");
      activeDotIndex = index;
    } else {
      dot.classList.remove("active-dot");
    }
  });

  if (activeDotIndex >= 0) {
    const progressPercentage = (activeDotIndex / (dots.length - 1)) * 100;
    document.getElementById(
      "progress-bar"
    ).style.width = `${progressPercentage}%`;
  }
}
function createProgressDots() {
  const progressDotsContainer = document.getElementById("progress-dots");
  progressDotsContainer.innerHTML = ""; // Clear existing dots

  questions.forEach(() => {
    const dot = document.createElement("div");
    dot.classList.add("progress-dot");
    progressDotsContainer.appendChild(dot);
  });
  updateProgress(); // Call this to update progress initially
}

// Display the current question
// Display the current question and update suggestions
function displayQuestion() {
  if (currentQuestionIndex < questions.length) {
    const currentQuestion = questions[currentQuestionIndex];
    document.getElementById("question").innerText = currentQuestion.question;
    document.getElementById("answerInput").value = "";
    updateActiveDot();
    searchAnswer(); // Call this to update suggestions for the current question
    document.getElementById("searchResults").style.display = ""; // Optionally hide suggestions
  } else {
    document.getElementById("question").innerText =
      "Alle fragen sind beantwortet 🎉 Du kannst die Seite jetzt verlassen.";
    document.getElementById("search-container").style.display = "none";
  }
}

// Update the active dot
function updateActiveDot() {
  const dots = document.querySelectorAll(".progress-dot");
  dots.forEach((dot, index) => {
    dot.classList.toggle("active-dot", index === currentQuestionIndex);
  });
}

// Submit answer and go to the next question
function submitAnswer() {
  const answer = {
    questionId: questions[currentQuestionIndex].id,
    answer: document.getElementById("answerInput").value,
  };

  fetch("/answers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(answer),
  })
    .then((response) => response.text())
    .then((data) => {
      currentQuestionIndex++;
      localStorage.setItem("currentQuestionIndex", currentQuestionIndex); // Store progress
      displayQuestion(); // Show next question
      updateProgress(); // Update the progress bar and active dot
    });
}

// Populate search results
function searchAnswer() {
  const input = document.getElementById("answerInput").value.toLowerCase();
  const category = questions[currentQuestionIndex].category || "teachers"; // default category if not set
  const suggestions = persons[category]
    .filter((person) => person.toLowerCase().includes(input))
    .map((name) => `<li onclick="selectPerson('${name}')">${name}</li>`)
    .join("");

  document.getElementById("searchResults").innerHTML = suggestions;
}

// Handle the selection of a person from suggestions
function selectPerson(name) {
  const answerInput = document.getElementById("answerInput");
  answerInput.value = name;
  document.getElementById("searchResults").style.display = "none"; // Optionally hide suggestions
}

// Add event listener for when the input field is focused
document.getElementById("answerInput").addEventListener("focus", function () {
  const searchResults = document.getElementById("searchResults");
  if (this.value) {
    searchResults.style.display = "block"; // Show suggestions if there is text in the input
  } else {
    searchAnswer(); // Call searchAnswer to populate suggestions if the input is empty
    searchResults.style.display = "block";
  }
});

// Initialize questionnaire on page load
window.onload = initializeQuestionnaire;
