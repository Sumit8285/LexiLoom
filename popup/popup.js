// document.addEventListener('DOMContentLoaded', function() {
//     chrome.tabs.sendMessage(null, 'my-message');
// });
// get the currently active tab in the current window
// and then invoke the callback function gotTabs.
let query = { active: true, currentWindow: true };
chrome.tabs.query(query, gotTabs);

// function to check current url and eliminate offline urls.
function safeUrl(url) {
    return url.startsWith("https://") || url.startsWith("http://");
}

// callback function
function gotTabs(tabs) {
    // prevent offline urls to run the extension by throwing error.
    if (!safeUrl(tabs[0].url)) {
        document.getElementById("error").innerHTML = "Oh no!";
        document.getElementById("definition").innerHTML = "Unsupported Page.";
        return;
    }

    let msg = {
        txt: "hello from popup",
    };

    // send message to the content script
    chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
        if (!response) {
            document.getElementById("phonetic").innerHTML =
                "Refresh the page and try again.";
        } else if (response.swor === "_TextNotSelected_") {
            document.getElementById("phonetic").innerHTML = "Welcome!";
            document.getElementById("example").innerHTML =
                "Please select a word or type to find its definition.";
            const submit_pressed = document.getElementById("submit_button");
            submit_pressed.addEventListener('click', function() {
                const textBox = document.getElementById("textele");
                var textBoxValue = textBox.value;
                if (textBoxValue.length > 0) {
                    textBoxValue.replace(/[^a-zA-Z ]/g, "");
                    dictionary(textBoxValue);
                } else {
                    document.getElementById("phonetic").innerHTML = "Welcome!";
                    document.getElementById("example").innerHTML =
                        "Please select or type a word to find its definition.";
                }
            });
        } else {
            let swo = response.swor;
            swo = swo.replace(/[^a-zA-Z ]/g, "");
            dictionary(swo);
        }
    });
}

let wordef,
    word,
    phonetic,
    pos,
    defin,
    example,
    sourceurl,
    index = 0,
    indlimit,
    flag = 0;

// function to fetch and show definition on the popup
async function dictionary(query) {
    let url = `https://api.dictionaryapi.dev/api/v2/entries/en/${query}`;
    let response = await fetch(url);
    wordef = await response.json();
    if (wordef && !wordef.title) {
        indlimit = wordef[0].meanings.length;
        word = wordef[0].word;
        phonetic = wordef[0].phonetic ? wordef[0].phonetic : "";
        sourceurl = `https://en.wiktionary.org/wiki/${word}`;
        index = 0;

        setValues();

        if (indlimit > 1) {
            document.getElementById("navigatecontainer").classList.remove("hidenavigator");
        }
    } else if (wordef.title) {
        document.getElementById("error").innerHTML = "⚠  " + wordef.title;
    }
}

document.getElementById("prev").addEventListener("click", handlePrevious);
document.getElementById("next").addEventListener("click", handleNext);

function handlePrevious() {
    index = index - 1;
    if (index < 0) index = indlimit - 1;
    setValues();
}

function handleNext() {
    index = index + 1;
    if (index >= indlimit) index = 0;
    setValues();
}

function getHtmlContent(elementId) {
    var element = document.getElementById(elementId);
    return element.innerHTML;
}

function createButton() {
    // Create the button element
    const divi = document.getElementById('phone');
    const button = document.createElement('button');

    // Set the button text
    button.textContent = 'Speakit';

    // Set the button position


    // Append the button to the DOM
    divi.appendChild(button);

    // Add an event listener to the button
    button.addEventListener('click', function() {
        // Do something when the button is clicked
        chrome.tts.speak(word, { 'rate': 0.8 });

    });
}


function setValues() {
    pos = wordef[0].meanings[index].partOfSpeech;
    defin = wordef[0].meanings[index].definitions[0].definition;
    example = wordef[0].meanings[index].definitions[0].example ?
        wordef[0].meanings[index].definitions[0].example :
        null;

    document.getElementById(
        "word"
    ).innerHTML = `${word} <a href=${sourceurl} class="searchanchor" target="_blank"><img class="searchsvg" title="read more" src = "../assets/searchonweb.svg" alt="read more"/><a>`;
    if (flag == 0) {
        createButton();
        flag = 1;
    }
    document.getElementById("phonetic").innerHTML = `${phonetic}  (${pos})`;
    document.getElementById("definition").innerHTML = defin;
    if (example) {
        document.getElementById("example").innerHTML = `Example: ${example}`;
    } else {
        document.getElementById("example").innerHTML = "";
    }
    var list = [];
    const localstorage = window.localStorage;
    count = 1;
    const lovedit = document.getElementById("loveit_button");
    if (lovedit) {

        document.getElementById('editword').innerHTML = `${word}  (${defin})`;
        lovedit.addEventListener('click', function() {
            const print = document.getElementById('print');
            const ew = document.getElementById('editword');
            //print.appendChild(ew);
            console.log(ew);
            list.push(ew);
            count++;
        });
    }
    const savedit = document.getElementById("saveit_button");
    if (savedit) {
        savedit.addEventListener('click', function() {
            const print = document.getElementById('print');

            for (const li of list) {
                console.log(li);
                print.appendChild(li);
            }
            html2pdf().from(print).saveAs(new Date().toISOString() + '.pdf', {
                pageSize: 'A4',
                margins: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                },
                font: 'Times New Roman',
            });
        });
    }
}