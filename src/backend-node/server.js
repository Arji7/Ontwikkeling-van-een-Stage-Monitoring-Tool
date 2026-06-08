const express = require('express');
const app = express();

const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello Farouk');
});

app.listen(port, () => {
    console.log(`App Listing on Port ${port}`);
});
