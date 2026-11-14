
const cleanSpeechText = (text = "") => {
    let clean = text;

    // Remove Markdown links but preserve their readable labels
    clean = clean.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1");

    // Remove raw URLs, email addresses and Google Meet links
    clean = clean.replace(/https?:\/\/\S+/gi, "");
    clean = clean.replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "");

    // Remove code blocks and inline code
    clean = clean.replace(/```[\s\S]*?```/g, "");
    clean = clean.replace(/`([^`]+)`/g, "$1");

    // Remove Markdown table separators and formatting
    clean = clean.replace(/^\|?[\s:|-]+\|?$/gm, "");
    clean = clean.replace(/\|/g, ". ");
    clean = clean.replace(/[#*_~]/g, "");

    // Avoid reading technical IDs and special-character sequences
    clean = clean.replace(/\b[A-Za-z0-9_-]{18,}\b/g, "");
    clean = clean.replace(/[{}[\]<>@#$%^&*=\\]/g, " ");

    // Normalize punctuation and whitespace
    clean = clean.replace(/[•▪►]/g, "");
    clean = clean.replace(/\s*([,!?।])\s*/g, "$1 ");
    clean = clean.replace(/[.]{2,}/g, ".");
    clean = clean.replace(/\s+/g, " ").trim();

    return clean;
};

const splitIntoSentences = (text) => {
    return text
        .match(/[^.!?।]+[.!?।]?/g)
        ?.map(sentence => sentence.trim())
        .filter(Boolean) || [];
};

export { cleanSpeechText, splitIntoSentences };
