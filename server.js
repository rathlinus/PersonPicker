const express = require("express");
const crypto = require("crypto");
const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config();
const app = express();
const PORT = 3001;

app.use(express.static("public"));
app.use(express.json());

// Create a connection to the database
const db = mysql.createConnection({
  host: process.env.databasehost,
  user: process.env.databaseuser,
  password: process.env.databasepassword,
  database: process.env.databasename,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: ", err);
    return;
  }
  console.log("Connected to the MySQL server.");
});

// Endpoint to serve the voting page for a specific poll
app.get("/poll/:pollId", (req, res) => {
  const pollId = req.params.pollId;

  pollExists(pollId)
    .then((exists) => {
      if (!exists) {
        fs.readFile("routes/error/index.html", (err, data) => {
          if (err) {
            res.status(500).send("Error loading the error page");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        });
      } else {
        fs.readFile("routes/poll/index.html", (err, data) => {
          if (err) {
            res.status(500).send("Error loading the voting page");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        });
      }
    })
    .catch((err) => {
      res.status(500).send("Error checking poll existence");
    });
});

// Endpoint to serve the voting page for a specific poll
app.get("/poll/", (req, res) => {
  fs.readFile("routes/error/index.html", (err, data) => {
    if (err) {
      res.status(500).send("Error loading the error page");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

// Serve the admin dashboard page
app.get("/poll/:pollId/edit", (req, res) => {
  fs.readFile("routes/edit/index.html", (err, data) => {
    if (err) {
      res.status(500).send("Error reading the admin dashboard file");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

// Serve the admin dashboard page
app.get("/", (req, res) => {
  fs.readFile("routes/home/index.html", (err, data) => {
    if (err) {
      res.status(500).send("Error reading the admin dashboard file");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

// Serve the admin dashboard page
app.get("/poll/:pollId/dash", (req, res) => {
  fs.readFile("routes/dash/index.html", (err, data) => {
    if (err) {
      res.status(500).send("Error reading the admin dashboard file");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

app.get("/poll/:pollId/questions", (req, res) => {
  const pollId = req.params.pollId;

  const queryQuestions =
    "SELECT questions_json FROM questions WHERE poll_id = ?";
  const queryTitle = "SELECT title FROM polls WHERE unique_identifier = ?";

  // Create promises for both queries
  const questionsPromise = new Promise((resolve, reject) => {
    db.query(queryQuestions, [pollId], (err, results) => {
      if (err) {
        console.error(err);
        reject("Error fetching questions from the database");
      } else {
        resolve(results);
      }
    });
  });

  const titlePromise = new Promise((resolve, reject) => {
    db.query(queryTitle, [pollId], (err, results) => {
      if (err) {
        console.error(err);
        reject("Error fetching poll title from the database");
      } else {
        resolve(results);
      }
    });
  });

  // Execute both promises and handle the responses
  Promise.all([questionsPromise, titlePromise])
    .then(([questionsResults, titleResults]) => {
      if (questionsResults.length > 0 && questionsResults[0].questions_json) {
        const response = {
          title: titleResults.length > 0 ? titleResults[0].title : "No Title",
          questions: questionsResults[0].questions_json,
        };
        res.json(response);
      } else {
        res.json({ title: "No Title", questions: [] });
      }
    })
    .catch((error) => {
      res.status(500).send(error);
      console.error(error);
    });
});

app.get("/poll/:pollId/votes", (req, res) => {
  const pollId = req.params.pollId;

  const query = "SELECT answer FROM answers WHERE poll_id = ?";
  db.query(query, [pollId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error fetching questions from the database");
      return;
    }

    // Check if results has at least one row and questions_json is not null
    if (results.length > 0) {
      res.send(results); // Send the JSON string directly
    } else {
      res.json([]); // Send an empty array if no data is found
    }
  });
});

app.post("/poll/:pollId/update-questions", (req, res) => {
  const pollId = req.params.pollId;
  const questionsJson = req.body; // Assuming the entire set of questions is sent as a JSON object

  const query =
    "INSERT INTO questions (poll_id, questions_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE questions_json = ?";
  db.query(
    query,
    [pollId, JSON.stringify(questionsJson), JSON.stringify(questionsJson)],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error updating questions in the database");
        return;
      }
      res.status(200).send("Questions updated successfully");
    }
  );
});

app.post("/poll/:pollId/update-persons", (req, res) => {
  const pollId = req.params.pollId;
  const personsJson = req.body; // Assuming the entire set of questions is sent as a JSON object

  const query =
    "INSERT INTO persons (poll_id, json) VALUES (?, ?) ON DUPLICATE KEY UPDATE json = ?";
  db.query(
    query,
    [pollId, JSON.stringify(personsJson), JSON.stringify(personsJson)],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error updating persons in the database");
        return;
      }
      res.status(200).send("persons updated successfully");
    }
  );
});

const ADMIN_PASSWORD = "31137";

app.post("/poll/:pollId/verify-password", (req, res) => {
  // As this involves just a simple comparison, you might want to keep it as is.
  // Alternatively, store admin passwords securely in the database and compare.
  if (req.body.password === ADMIN_PASSWORD) {
    res.status(200).send({ verified: true });
  } else {
    res.status(401).send({ verified: false });
  }
});

app.post("/poll/:pollId/answers", (req, res) => {
  const pollId = req.params.pollId;
  const newAnswer = req.body;

  const readQuery = "SELECT answer FROM answers WHERE poll_id = ?";

  db.query(readQuery, [pollId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading from the database");
      return;
    }

    let answers;
    if (result.length) {
      // Parse existing answers if present
      answers = JSON.parse(result[0].answer);
      if (!Array.isArray(answers)) {
        answers = [];
      }
    } else {
      // Initialize answers array if no entry exists
      answers = [];
    }

    // Find or create the question entry in answers
    let questionAnswer = answers.find(
      (ans) => ans.questionId === newAnswer.questionId
    );
    if (!questionAnswer) {
      questionAnswer = { questionId: newAnswer.questionId, votes: {} };
      answers.push(questionAnswer);
    }

    // Update the vote count for the answer
    if (questionAnswer.votes[newAnswer.answer]) {
      questionAnswer.votes[newAnswer.answer]++;
    } else {
      questionAnswer.votes[newAnswer.answer] = 1;
    }

    const updateQuery = `
    INSERT INTO answers (poll_id, answer) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE answer = VALUES(answer)`;

    db.query(
      updateQuery,
      [pollId, JSON.stringify(answers)],
      (err, updateResult) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error updating the database");
          return;
        }
        res.status(200).send("Answer updated successfully");
      }
    );
  });
});

app.get("/poll/:pollId/persons", (req, res) => {
  // Query to fetch persons filtering by poll_id
  const query = "SELECT * FROM persons WHERE poll_id = ?";
  db.query(query, [req.params.pollId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error fetching persons from the database");
      return;
    }
    res.json(results);
  });
});

app.get("/new", (req, res) => {
  const newPollId = crypto.randomBytes(4).toString("hex");

  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting the transaction:", err);
      return res.status(500).send("Error starting the transaction");
    }

    const persons = [
      { name: "John Doe", category: "student" },
      { name: "Jane Smith", category: "student" },
      { name: "Mr. Anderson", category: "teacher" },
      { name: "Ms. Johnson", category: "teacher" },
    ];

    const insertPollQuery =
      "INSERT INTO polls (unique_identifier, title) VALUES (?, ?)";
    db.query(insertPollQuery, [newPollId, "New Poll"], (err, result) => {
      if (err) {
        console.error("Error creating a new poll in the database:", err);
        return db.rollback(() => {
          res.status(500).send("Error creating a new poll in the database");
        });
      }

      let insertPersonsQuery = `
        INSERT INTO persons (poll_id, json)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE json = VALUES(json)
      `;
      db.query(
        insertPersonsQuery,
        [newPollId, JSON.stringify(persons)],
        (err, result) => {
          if (err) {
            console.error("Error adding persons to the database:", err);
            return db.rollback(() => {
              res.status(500).send("Error adding persons to the database");
            });
          }

          db.commit((err) => {
            if (err) {
              console.error("Error committing the transaction:", err);
              return db.rollback(() => {
                res.status(500).send("Error committing the transaction");
              });
            }
            res.redirect(`/poll/${newPollId}/edit`);
          });
        }
      );
    });
  });
});

function pollExists(pollId) {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM polls WHERE unique_identifier = ?";
    db.query(query, [pollId], (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results.length > 0);
    });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port http://127.0.0.1:${PORT}/`);
});
