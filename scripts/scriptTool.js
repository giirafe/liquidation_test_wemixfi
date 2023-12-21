// color constants for logging
const COLORS = {
    RESET: "\x1b[0m",
    RED: "\x1b[31m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m"
};

function logSuccess(...messages) {
    logWithColor(COLORS.GREEN,messages)
}

function logError(...messages) {
    logWithColor(COLORS.RED,messages)
}

function logWithColor(color, message) {
    console.log(color, message, COLORS.RESET);
}

module.exports = {
    logSuccess,
    logError
};