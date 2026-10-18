// Escape text before inserting it into HTML, so user input and YouTube comments are shown as text, not run as markup
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

if (typeof module !== "undefined") module.exports = { escapeHtml };
