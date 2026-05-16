const express = require('express');
const mysql = require('mysql');
const app = express();

// BAD: Hardcoded database credentials
const DB_HOST = 'sql-cnapp-bad.database.windows.net';
const DB_USER = 'adminuser';
const DB_PASS = 'P@ssw0rd123!';

// BAD: Hardcoded API keys
const AZURE_OPENAI_KEY = 'sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234';
const STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=http;AccountName=stcnappbadstorage;AccountKey=FAKE+KEY+FOR+DEMO+ONLY+abc123==;EndpointSuffix=core.windows.net';

const connection = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: 'appdb'
});

// BAD: SQL Injection — user input directly concatenated into query
app.get('/users', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  connection.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    res.json(results);
  });
});

// BAD: Command injection via user input
app.get('/ping', (req, res) => {
  const host = req.query.host;
  const exec = require('child_process').exec;
  exec('ping -c 1 ' + host, (err, stdout) => {
    res.send(stdout);
  });
});

// BAD: Path traversal — no sanitization
app.get('/file', (req, res) => {
  const filename = req.query.name;
  const fs = require('fs');
  fs.readFile('/data/' + filename, 'utf8', (err, data) => {
    if (err) return res.status(404).send('Not found');
    res.send(data);
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
