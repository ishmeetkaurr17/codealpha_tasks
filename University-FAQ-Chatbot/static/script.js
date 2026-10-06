const input = document.querySelector(".input-area input");
const sendButton = document.querySelector(".input-area button");
const chatBox = document.querySelector(".chat-box");
const languageSelect = document.querySelector("#language");

let conversationClosed = false;

function addMessage(message, type) {
    const messageDiv = document.createElement("div");

    messageDiv.classList.add(type + "-message");
    messageDiv.textContent = message;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}


async function sendQuestion() {
    const question = input.value.trim();

if (!question || conversationClosed) {
    return;
}

const welcomeSection = document.querySelector(".welcome-section");
const faqSection = document.querySelector(".faq-section");

if (welcomeSection) {
    welcomeSection.style.display = "none";
}

if (faqSection) {
    faqSection.style.display = "none";
}

    addMessage(question, "user");

    input.value = "";
    input.focus();

    const selectedLanguage = languageSelect.value;
    const lowerQuestion = question.toLowerCase();

const endingMessages = [
    "bye",
    "goodbye",
    "thank you",
    "thanks",
    "thankyou",
    "thank u",
    "thx",
    "thnkyou",
    "thnk you",
    "that's all",
    "thats all",
    "no more questions",
    "nothing else"
];

const isThankYouMessage =
    lowerQuestion.includes("thank") ||
    lowerQuestion.includes("thnk") ||
    lowerQuestion.includes("thnkyou");

const isEndingMessage = endingMessages.some(function(message) {
    return lowerQuestion.includes(message);
});

if (isEndingMessage || isThankYouMessage) {
    addMessage(
        "You're very welcome! Thank you for chatting with us. Have a great day!",
        "bot"
    );

    document.querySelector("#feedback-section").style.display = "block";

    return;
}

    try {
        const response = await fetch("/ask", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                question: question,
                language: selectedLanguage
            })
        });

        const data = await response.json();

        addMessage(data.answer, "bot");

    } catch (error) {
        console.error("Error:", error);

        addMessage(
            "Sorry, something went wrong. Please try again.",
            "bot"
        );
    }
}


sendButton.addEventListener("click", sendQuestion);


input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendQuestion();
    }
});

const quickButtons = document.querySelectorAll(".quick-questions button");

quickButtons.forEach(function(button) {
    button.addEventListener("click", function() {

        input.value = button.textContent;

        if (languageSelect.value === "auto") {
            languageSelect.value = "en";
        }

        sendQuestion();
    });
});

const ratingButtons = document.querySelectorAll(".rating button");
const feedbackSubmit = document.querySelector("#feedback-submit");
const feedbackMessage = document.querySelector("#feedback-message");

let selectedRating = 0;


ratingButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        selectedRating = Number(button.dataset.rating);

        ratingButtons.forEach(function(item) {
            item.classList.remove("selected");
        });

        button.classList.add("selected");
    });

});


if (feedbackSubmit) {

    feedbackSubmit.addEventListener("click", function() {

        if (selectedRating === 0) {

            feedbackMessage.textContent =
                "Please select a rating first.";

            return;
        }

        feedbackMessage.textContent =
            "Thank you for your feedback!";

        feedbackSubmit.textContent = "Feedback Submitted";

        feedbackSubmit.disabled = true;
        document.querySelector("#conversation-closed").style.display = "block";

        conversationClosed = true;

        input.disabled = true;
        input.placeholder = "Conversation has ended";

        sendButton.disabled = true;

    });

}


