require("dotenv").config();

const app = require("./app");

const PORT = process.env.API_PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing server');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
