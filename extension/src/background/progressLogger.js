module.exports = {
    log(str) {
        sendMessage(str, Severity.NONE);
    },

    warn(str) {
        sendMessage(str, Severity.WARNING);
    },

    error(str) {
        sendMessage(str, Severity.ERROR);
    },

    updateStatus(status) {
        chrome.runtime.sendMessage({
            action: 'update-status',
            status: status,
        });
    }
};


function sendMessage(str, severity) {
    chrome.runtime.sendMessage({
        action: 'update-progress',
        message: str,
        severity: severity,
    });
}

const Severity = {
    NONE: 0,
    WARNING: 1,
    ERROR: 2,
};