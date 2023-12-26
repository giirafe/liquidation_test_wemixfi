// color constants for logging
const COLORS = {
    RESET: "\x1b[0m",
    RED: "\x1b[31m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m",
    MAGENTA : "\x1b[35m",
    ORANGE: "\x1b[38;5;208m"
};

function logSuccess(...messages) {
    logWithColor(COLORS.MAGENTA,messages)
}

function logError(...messages) {
    logWithColor(COLORS.RED,messages)
}

function startNewScript(message) {
    logWithColor(COLORS.ORANGE, "=======================",message,"=======================")
}

function logWithColor(color, ...messages) {
    console.log(color, ...messages, COLORS.RESET);
}

module.exports = {
    logSuccess,
    logError,
    startNewScript
};