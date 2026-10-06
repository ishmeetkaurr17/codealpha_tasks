
// Selecting HTML elements

const sourceLang = document.getElementById("sourceLang");
const targetLang = document.getElementById("targetLang");

const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");

const translateBtn = document.getElementById("translateBtn");
const swapBtn = document.getElementById("swapBtn");
const copyBtn = document.getElementById("copyBtn");
const speakBtn = document.getElementById("speakBtn");

const status = document.getElementById("status");


// Translation API function


async function translateText() {

    const text = inputText.value.trim();
    const source = sourceLang.value;
    const target = targetLang.value;

    if (text === "") {
        status.textContent = "Please enter some text first.";
        inputText.focus();
        return;
    }

    if (source === target) {
        status.textContent = "Please select different languages.";
        return;
    }

    status.textContent = "Translating...";
    outputText.value = "";
    translateBtn.disabled = true;

    try {

        const url =
            "https://translate.googleapis.com/translate_a/single" +
            "?client=gtx" +
            "&sl=" + source +
            "&tl=" + target +
            "&dt=t" +
            "&q=" + encodeURIComponent(text);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Translation service is unavailable.");
        }

        const data = await response.json();

        if (!data || !data[0]) {
            throw new Error("No translation received.");
        }

        const translatedText = data[0]
            .map(item => item[0])
            .filter(Boolean)
            .join("");

        if (!translatedText) {
            throw new Error("Translation could not be generated.");
        }

        outputText.value = translatedText;
        status.textContent = "Translation completed successfully.";

    }

    catch (error) {

        console.error(error);

        status.textContent =
            "Unable to translate. Please try again later.";

    }

    finally {

        translateBtn.disabled = false;

    }
}
// Swap source and target languages

function swapLanguages() {

    const previousSource = sourceLang.value;

    sourceLang.value = targetLang.value;
    targetLang.value = previousSource;

    // Swap text only when a translation exists

    if (outputText.value.trim() !== "") {

        const previousInput = inputText.value;

        inputText.value = outputText.value;
        outputText.value = previousInput;

    }

    status.textContent = "";

}


// Copy translated text

async function copyText() {

    const translatedText = outputText.value;

    if (translatedText.trim() === "") {
        status.textContent = "There is no translated text to copy.";
        return;
    }

    try {

        await navigator.clipboard.writeText(translatedText);

        status.textContent = "Translation copied successfully.";

    }

    catch (error) {

        // Fallback for clipboard access issues

        outputText.select();

        const copied = document.execCommand("copy");

        status.textContent = copied
            ? "Translation copied successfully."
            : "Unable to copy the text.";

    }

}


// Text-to-speech function

function speakText() {

    const translatedText = outputText.value.trim();

    if (translatedText === "") {
        status.textContent = "Translate some text before using Listen.";
        return;
    }

    if (!("speechSynthesis" in window)) {
        status.textContent = "Text-to-speech is not supported in this browser.";
        return;
    }

    // Create speech from translated text

    const speech = new SpeechSynthesisUtterance(translatedText);

    speech.lang = targetLang.value;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);

    status.textContent = "Playing translated text...";

}


// Connect buttons with their functions

translateBtn.addEventListener("click", translateText);

swapBtn.addEventListener("click", swapLanguages);

copyBtn.addEventListener("click", copyText);

speakBtn.addEventListener("click", speakText);