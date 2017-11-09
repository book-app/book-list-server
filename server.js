'use strict';

// application dependancies
const pg = require('pg');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');


// application setup
const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL;

// database setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// application middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());
app.use(express.static('./'));


app.get('/test', (req, res) => res.send('Testing 1, 2, 3'));

app.get('/api/vi/books', (req, res) => {
  client.query(`SELECT book_id, title, author, image_url, isbn FROM books;`)
    .then(results => res.send(results.rows))
    .catch(console.error);
});
app.get('*', (req, res) => res.redirect(CLIENT_URL));



app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));


function loadBooks() {
  client.query('SELECT COUNT(*) FROM books')
    .then(result => {
      if (!parseInt(result.rows[0].count)) {
        fs.readFile('./data/books.json', (err, fd) => {
          console.log(fd, '************');
          JSON.parse(fd.toString()).forEach(book => {
            client.query(`
              INSERT INTO
                books(author, title, isbn, image_url, description)
                  VALUES($1, $2, $3, $4, $5);
                  `,
              [book.author, book.title, book.isbn, book.image_url, book.description]
            )
              .catch(console.err);
          });
        });
      }
    });
}

function loadDB () {
  client.query(`
    CREATE TABLE IF NOT EXISTS
    books(book_id SERIAL PRIMARY KEY, author VARCHAR(255), title VARCHAR(255), isbn VARCHAR(255), image_url VARCHAR(255), description TEXT);
    `)
    .then(() => {
      loadBooks();
    })
    .catch(err => console.log(err));
}

loadDB();
