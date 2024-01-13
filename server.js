const express = require("express");
const fs = require("fs");
const app = express();
const PORT = 3001;

app.use(express.static("public")); // Serve static files from 'public' directory
app.use(express.json()); // For parsing application/json

// Endpoint to get questions
app.get("/questions", (req, res) => {
  fs.readFile("questions.json", (err, data) => {
    if (err) {
      res.status(500).send("Error reading questions file");
      return;
    }
    res.json(JSON.parse(data));
  });
});

// Serve the admin dashboard page
app.get("/admin", (req, res) => {
  fs.readFile("dash/index.html", (err, data) => {
    if (err) {
      res.status(500).send("Error reading the admin dashboard file");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

app.get("/answers.json", (req, res) => {
  fs.readFile("answers.json", (err, data) => {
    if (err) {
      res.status(500).send("Error reading answers file");
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  });
});

app.post("/update-questions", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    res.status(401).send("Unauthorized");
    return;
  }

  const updatedQuestions = req.body.questions;
  fs.writeFile(
    "questions.json",
    JSON.stringify(updatedQuestions, null, 2),
    (err) => {
      if (err) {
        res.status(500).send("Error writing to questions file");
        return;
      }
      res.status(200).send("Questions updated");
    }
  );
});

// Endpoint to post answers
app.post("/answers", (req, res) => {
  const newAnswer = req.body; // { questionId: 1, answer: "John Doe" }

  // Read the current answers file
  fs.readFile("answers.json", (err, data) => {
    if (err) {
      res.status(500).send("Error reading answers file");
      return;
    }

    // Parse the current answers data
    let answers = JSON.parse(data);

    // Initialize the structure if it's not set up properly
    if (!Array.isArray(answers)) {
      answers = [];
    }

    // Find the existing entry for the question or create a new one
    let questionAnswers = answers.find(
      (ans) => ans.questionId === newAnswer.questionId
    );
    if (!questionAnswers) {
      questionAnswers = { questionId: newAnswer.questionId, votes: {} };
      answers.push(questionAnswers);
    }

    // Increment the vote count for the given answer
    if (questionAnswers.votes[newAnswer.answer]) {
      questionAnswers.votes[newAnswer.answer]++;
    } else {
      questionAnswers.votes[newAnswer.answer] = 1;
    }

    // Write the updated answers back to the file
    fs.writeFile("answers.json", JSON.stringify(answers, null, 2), (err) => {
      if (err) {
        res.status(500).send("Error writing to answers file");
        return;
      }
      res.status(200).send("Answer saved");
    });
  });
});

app.get("/persons", (req, res) => {
  fs.readFile("data/persons.json", (err, data) => {
    if (err) {
      res.status(500).send("Error reading persons file");
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
