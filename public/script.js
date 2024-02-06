let persons = [];
let currentQuestionIndex = 0;
let questions = [];
let pollId = new URL(window.location.href).pathname.split("/")[2];

// Function to initialize the questionnaire
function initializeQuestionnaire() {
  Promise.all([
    fetch(`/poll/${pollId}/persons`).then((response) => response.json()),
    fetchQuestions(),
  ]).then(([personsData, _]) => {
    persons = personsData[0].json;
    // Retrieve progress from cookie
    const progressCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`progress-${pollId}=`));
    if (progressCookie) {
      currentQuestionIndex = parseInt(progressCookie.split("=")[1]);
    }

    createProgressDots();
    displayQuestion();
  });
}

async function fetchQuestions() {
  return fetch(`/poll/${pollId}/questions`)
    .then((response) => response.json())
    .then((data) => {
      // Update the heading with the title
      document.getElementById("heading").innerText = data.title;
      // Set the questions array
      questions = data.questions;
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

function createCompletionDot() {
  const progressDotsContainer = document.getElementById("progress-dots");
  const dot = document.createElement("div");
  dot.classList.add("progress-dot", "completion-dot");
  dot.innerHTML = "🎉"; // Add the emoji inside the dot
  progressDotsContainer.appendChild(dot);
}

function createProgressDots() {
  const progressDotsContainer = document.getElementById("progress-dots");
  progressDotsContainer.innerHTML = ""; // Clear existing dots

  questions.forEach(() => {
    const dot = document.createElement("div");
    dot.classList.add("progress-dot");
    progressDotsContainer.appendChild(dot);
  });

  // Add spacing between dots
  const dots = document.querySelectorAll(".progress-dot");
  dots.forEach((dot, index) => {
    if (index !== dots.length - 1) {
      dot.style.marginRight = "10px"; // Adjust the spacing as needed
    }
  });

  updateProgress(); // Call this to update progress initially
}

// Display the current question and update suggestions
function displayQuestion() {
  if (currentQuestionIndex < questions.length) {
    const currentQuestion = questions[currentQuestionIndex];
    document.getElementById("question").innerText =
      currentQuestion.question_text;
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
  const answerInput = document.getElementById("answerInput").value;
  const category = "teachers";
  const submitButton = document.getElementById("submitAnswer");

  // Check if the answer is in the list of persons
  if (!persons.some((person) => person.name === answerInput)) {
    // Apply the invalid-answer class for animation
    submitButton.classList.add("invalid-answer");

    // Remove the class after the animation ends
    setTimeout(() => {
      submitButton.classList.remove("invalid-answer");
    }, 600); // 500ms matches the duration of the animation

    return;
  }

  const answer = {
    questionId: questions[currentQuestionIndex].id,
    answer: answerInput,
  };

  // Check if question has already been answered
  const answeredQuestionsCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("answeredQuestions="));
  let answeredQuestions = [];
  if (answeredQuestionsCookie) {
    answeredQuestions = JSON.parse(answeredQuestionsCookie.split("=")[1]);
    if (answeredQuestions.includes(answer.questionId)) {
      alert("You have already answered this question.");
      //skip to next question
      currentQuestionIndex++;
      displayQuestion();
      return;
    }
  }

  fetch(`/poll/${pollId}/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(answer),
  })
    .then((response) => response.text())
    .then((data) => {
      currentQuestionIndex++;
      // Store progress in cookie
      document.cookie = `progress-${pollId}=${currentQuestionIndex}`;

      // Store answered questions in cookie
      const answeredQuestionsCookieName = `answeredQuestions-${pollId}`;
      let answeredQuestions = [];
      const answeredQuestionsCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${answeredQuestionsCookieName}=`));
      if (answeredQuestionsCookie) {
        answeredQuestions = JSON.parse(answeredQuestionsCookie.split("=")[1]);
      }
      if (!answeredQuestions.includes(answer.questionId)) {
        answeredQuestions.push(answer.questionId);
      }
      document.cookie = `${answeredQuestionsCookieName}=${JSON.stringify(
        answeredQuestions
      )}`;
      displayQuestion(); // Show next question
      updateProgress(); // Update the progress bar and active dot
    });
}

function searchAnswer() {
  const input = document.getElementById("answerInput").value.toLowerCase();

  const suggestions = persons
    .filter((person) => person.name.toLowerCase().includes(input))
    .map(
      (person) =>
        `<li onclick="selectPerson('${person.name}')">${person.name}</li>`
    )
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

document.addEventListener("keydown", function (event) {
  // Check if the pressed key is the Enter key (key code 13)
  if (event.keyCode === 13) {
    // Call the submitAnswer() function when Enter is pressed
    submitAnswer();
  }
});
