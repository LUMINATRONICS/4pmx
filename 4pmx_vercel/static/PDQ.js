// PDQ.js

// 날짜 기본값 설정
document.addEventListener("DOMContentLoaded", async function () { // 'async' 추가
    // 날짜 기본값 설정
    const dateInput = document.getElementById("dateInput"); // ID 수정 ('date' -> 'dateInput')
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // 제출 버튼 이벤트 리스너 추가
    const submitBtn = document.getElementById("submit-button");
    if (submitBtn) {
        submitBtn.addEventListener("click", submitSurvey);
    } else {
        console.error("Submit button not found");
    }

    // 환자 정보 자동 입력 (재시도 로직)
    async function fetchPatientInfo(retries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const res = await fetch('/get-patient');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const patientData = await res.json();
                const patient = patientData.patient;

                const nameInput = document.querySelector('input[name="name"]');
                const ageInput = document.querySelector('input[name="age"]');

                if (nameInput && !nameInput.value && patient.name) nameInput.value = patient.name;
                if (ageInput && !ageInput.value && patient.age) ageInput.value = patient.age;

                if (patient.gender) {
                    const genderInput = document.querySelector(`input[name="gender"][value="${patient.gender}"]`);
                    if (genderInput && !genderInput.checked) genderInput.checked = true;
                }
                return;
            } catch (error) {
                console.error(`환자 정보 가져오기 시도 ${attempt}/${retries} 실패:`, error);
                if (attempt === retries) {
                    alert('환자 정보를 불러올 수 없습니다. 페이지를 새로고침 해주세요.');
                } else {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    }

    await fetchPatientInfo();
});

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const questions = [
    {
        type: "image-pair",
        text: "Q1. 주된 통증 부위를 선택해주십시오.",
        options: [
            { image: "/static/resources/painDETECT_image1_body.PNG" },
            { image: "/static/resources/painDETECT_image2_body.PNG" }
        ]
    },
    { type: "scale", text: "Q2. 지금 현재 귀하의 통증이 어느 정도라고 평가하시겠습니까?" },
    { type: "scale", text: "Q3. 지난 4주간 가장 심한 통증이 얼마나 심했습니까?" },
    { type: "scale", text: "Q4. 지난 4주간 통증이 평균적으로 얼마나 심했습니까?" },
    {
        type: "image-scale",
        text: "Q5. 귀하의 통증 경과를 가장 잘 설명하는 그림에 표시하십시오.",
        options: [
            { image: "/static/resources/painDETECT_image1.PNG", text: "약간의 기복이 있는 지속적인 통증" },
            { image: "/static/resources/painDETECT_image2.PNG", text: "통증 발작이 있는 지속적인 통증" },
            { image: "/static/resources/painDETECT_image3.PNG", text: "통증 발작 사이에는 통증이 없음" },
            { image: "/static/resources/painDETECT_image4.PNG", text: "통증 발작 사이에 통증이 있음" }
        ]
    },
    { type: "intensity", text: "Q6. 표시한 부위에 타는 듯한 느낌(예: 쏘는 통증)이 있습니까?" },
    { type: "intensity", text: "Q7. 통증 부위에 저리거나 따끔거림(개미가 기어가는 듯하거나 전기로 인해 찌릿함)을 느끼십니까?" },
    { type: "intensity", text: "Q8. 이 부위에 가볍게 닿으면(옷, 담요) 통증을 느끼십니까?" },
    { type: "intensity", text: "Q9. 통증 부위에 전기 충격과 같은 갑작스러운 통증 발작이 있습니까?" },
    { type: "intensity", text: "Q10.차가움 또는 열(목욕물)로 인해 이 부위에 종종 통증을 느끼십니까?" },
    { type: "intensity", text: "Q11. 표시한 부위가 무감각합니까?" },
    { type: "intensity", text: "Q12. 이 부위를 약간 눌러도(예: 손가락으로) 통증이 있습니까?" }
];

const questionContainer = document.getElementById("pdqQuestions");
if (!questionContainer) {
    console.error("Questions container not found");
}

const checkboxPositions = {
    left: [
        { number: 1, top: "93%", left: "14%" }, { number: 2, top: "93%", left: "72.5%" },
        { number: 3, top: "88%", left: "17%" }, { number: 4, top: "88%", left: "70.5%" },
        { number: 5, top: "77.5%", left: "14%" }, { number: 6, top: "77.5%", left: "69.5%" },
        { number: 7, top: "67%", left: "15%" }, { number: 8, top: "69%", left: "73.5%" },
        { number: 9, top: "54.5%", left: "17.5%" }, { number: 10, top: "54.5%", left: "70%" },
        { number: 11, top: "38%", left: "39%" }, { number: 12, top: "38%", left: "46.5%" },
        { number: 13, top: "39.5%", left: "30%" }, { number: 14, top: "40%", left: "56.7%" },
        { number: 15, top: "29.5%", left: "34%" }, { number: 16, top: "29.5%", left: "51%" },
        { number: 17, top: "19%", left: "33%" }, { number: 18, top: "19%", left: "52%" },
        { number: 19, top: "48%", left: "4%" }, { number: 20, top: "48%", left: "83.8%" },
        { number: 21, top: "44.2%", left: "1.3%" }, { number: 22, top: "43.9%", left: "87%" },
        { number: 23, top: "39%", left: "2.5%" }, { number: 24, top: "39%", left: "85.5%" },
        { number: 25, top: "31%", left: "-1%" }, { number: 26, top: "31.5%", left: "86.5%" },
        { number: 27, top: "24.5%", left: "4%" }, { number: 28, top: "24.5%", left: "79.2%" },
        { number: 29, top: "16.5%", left: "5%" }, { number: 30, top: "17.5%", left: "79%" },
        { number: 31, top: "1%", left: "30%" }, { number: 32, top: "1%", left: "56.5%" },
        { number: 33, top: "44.5%", left: "43%" }, { number: 34, top: "14%", left: "42%" },
    ],
    right: [
        { number: 35, top: "94%", left: "73.5%" }, { number: 36, top: "94%", left: "15%" },
        { number: 37, top: "90.3%", left: "73.5%" }, { number: 38, top: "90.2%", left: "16.5%" },
        { number: 39, top: "80.5%", left: "73.5%" }, { number: 40, top: "80.8%", left: "13.5%" },
        { number: 41, top: "70.3%", left: "78%" }, { number: 42, top: "70.5%", left: "11%" },
        { number: 43, top: "58.8%", left: "74%" }, { number: 44, top: "59%", left: "15%" },
        { number: 45, top: "40%", left: "58.5%" }, { number: 46, top: "40%", left: "32.5%" },
        { number: 47, top: "29.7%", left: "52%" }, { number: 48, top: "29.7%", left: "37.5%" },
        { number: 49, top: "18%", left: "55.5%" }, { number: 50, top: "18%", left: "35%" },
        { number: 51, top: "50.5%", left: "85.5%" }, { number: 52, top: "51%", left: "5%" },
        { number: 53, top: "46%", left: "86.5%" }, { number: 54, top: "46%", left: "2.5%" },
        { number: 55, top: "40%", left: "86.5%" }, { number: 56, top: "40%", left: "3%" },
        { number: 57, top: "32.5%", left: "88.4%" }, { number: 58, top: "32.1%", left: "0%" },
        { number: 59, top: "25%", left: "81%" }, { number: 60, top: "24%", left: "4%" },
        { number: 61, top: "17.3%", left: "81.8%" }, { number: 62, top: "17.5%", left: "8%" },
        { number: 63, top: "0.8%", left: "58.3%" }, { number: 64, top: "1%", left: "30.5%" },
        { number: 65, top: "45.5%", left: "45.3%" }, { number: 66, top: "40%", left: "45.3%" },
        { number: 67, top: "34.5%", left: "45.3%" }, { number: 68, top: "22%", left: "45.3%" },
        { number: 69, top: "11%", left: "45.3%" },
    ]
};

function createScaleButtons(questionText, questionName) {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-card";

    const label = document.createElement("div");
    label.className = "question-text";
    label.textContent = questionText;
    questionDiv.appendChild(label);

    const scaleContainer = document.createElement("div");
    scaleContainer.className = "scale-container";

    const scaleButtons = document.createElement("div");
    scaleButtons.className = "scale-buttons";
    scaleButtons.id = `${questionName}-scale`;

    // Hidden radio container
    const hiddenRadios = document.createElement("div");
    hiddenRadios.style.display = "none";

    for (let i = 0; i <= 10; i++) {
        // Button
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "score-btn";
        btn.textContent = i;

        btn.onclick = function () {
            // Update visual state
            const siblings = scaleButtons.children;
            for (let sib of siblings) {
                sib.classList.remove('selected');
            }
            this.classList.add('selected');

            // Update hidden radio
            const radio = hiddenRadios.querySelector(`input[value="${i}"]`);
            if (radio) radio.checked = true;
        };
        scaleButtons.appendChild(btn);

        // Hidden Radio
        const radioInput = document.createElement("input");
        radioInput.type = "radio";
        radioInput.name = questionName;
        radioInput.value = i;
        radioInput.id = `${questionName}_${i}`;
        hiddenRadios.appendChild(radioInput);
    }

    scaleContainer.appendChild(scaleButtons);
    scaleContainer.appendChild(hiddenRadios);

    // Labels
    const scaleLabels = document.createElement("div");
    scaleLabels.className = "scale-labels";

    const leftLabel = document.createElement("span");
    leftLabel.textContent = "없음";
    scaleLabels.appendChild(leftLabel);

    const rightLabel = document.createElement("span");
    rightLabel.textContent = "최대";
    scaleLabels.appendChild(rightLabel);

    scaleContainer.appendChild(scaleLabels);
    questionDiv.appendChild(scaleContainer);
    questionContainer.appendChild(questionDiv);
}

function createImagePairQuestion(questionText, questionName, options) {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-card image-pair-question";

    const label = document.createElement("div");
    label.className = "question-text";
    label.textContent = questionText;
    questionDiv.appendChild(label);

    const imagesContainer = document.createElement("div");
    imagesContainer.style.display = "flex";
    imagesContainer.style.justifyContent = "center";
    imagesContainer.style.gap = "20px";
    imagesContainer.style.position = "relative";
    imagesContainer.style.flexWrap = "wrap";

    options.forEach((option, index) => {
        const imgWrapper = document.createElement("div");
        imgWrapper.className = "image-container";

        const img = document.createElement("img");
        img.src = option.image;
        img.alt = `Image ${index + 1}`;
        img.style.width = "100%";
        img.style.maxWidth = "300px";
        img.style.aspectRatio = "482 / 1106";
        img.style.border = "1px solid #ccc";
        img.style.borderRadius = "5px";

        const checkboxContainer = document.createElement("div");
        checkboxContainer.className = "checkbox-container";

        const isLeftImage = index === 0;
        const positions = isLeftImage ? checkboxPositions.left : checkboxPositions.right;

        positions.forEach(pos => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "PDQ_Q1_checkbox";
            checkbox.value = pos.number;
            checkbox.id = `${questionName}_option${pos.number}`;
            checkbox.setAttribute('data-number', pos.number);
            checkbox.style.top = pos.top;
            checkbox.style.left = pos.left;

            const label = document.createElement("label");
            label.htmlFor = `${questionName}_option${pos.number}`;

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);

            checkbox.addEventListener('change', handleCheckboxChange);
        });

        imgWrapper.appendChild(img);
        imgWrapper.appendChild(checkboxContainer);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add("arrow-svg");

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", "arrowhead");
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "5");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arrowPath.setAttribute("d", "M0,0 L0,7 L10,3.5 z");
        arrowPath.setAttribute("fill", "rgba(255, 0, 0, 0.8)");
        marker.appendChild(arrowPath);
        defs.appendChild(marker);
        svg.appendChild(defs);

        imgWrapper.appendChild(svg);
        imagesContainer.appendChild(imgWrapper);
    });

    questionDiv.appendChild(imagesContainer);

    const spreadQuestionDiv = document.createElement("div");
    spreadQuestionDiv.style.marginTop = "30px";
    spreadQuestionDiv.style.textAlign = "center";
    spreadQuestionDiv.style.padding = "20px";
    spreadQuestionDiv.style.background = "#f9f9f9";
    spreadQuestionDiv.style.borderRadius = "10px";

    const spreadQuestionLabel = document.createElement("div");
    spreadQuestionLabel.className = "question-text";
    spreadQuestionLabel.style.fontSize = "1rem";
    spreadQuestionLabel.textContent = "Q1-1. 통증이 신체 다른 부분으로 퍼집니까?";
    spreadQuestionDiv.appendChild(spreadQuestionLabel);

    const spreadOptionsDiv = document.createElement("div");
    spreadOptionsDiv.style.display = "flex";
    spreadOptionsDiv.style.justifyContent = "center";
    spreadOptionsDiv.style.gap = "20px";
    spreadOptionsDiv.style.marginTop = "10px";

    const createSpreadOption = (value, text) => {
        const wrapper = document.createElement("div");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `${questionName}_spread`;
        input.value = value;
        input.id = `${questionName}_spread_${value}`;
        input.style.display = "none";

        const btn = document.createElement("label");
        btn.htmlFor = `${questionName}_spread_${value}`;
        btn.className = "score-btn-rect";
        btn.style.textAlign = "center";
        btn.style.width = "100px";
        btn.style.display = "inline-block";
        btn.textContent = text;

        input.addEventListener('change', function () {
            const allBtns = spreadOptionsDiv.querySelectorAll('.score-btn-rect');
            allBtns.forEach(b => b.classList.remove('selected'));
            if (this.checked) btn.classList.add('selected');

            if (value === 'yes') {
                enableArrowFunctionality();
            } else {
                disableArrowFunctionality();
                removeAllConnections();
            }
        });

        wrapper.appendChild(input);
        wrapper.appendChild(btn);
        return wrapper;
    };

    spreadOptionsDiv.appendChild(createSpreadOption("yes", "예"));
    spreadOptionsDiv.appendChild(createSpreadOption("no", "아니오"));

    spreadQuestionDiv.appendChild(spreadOptionsDiv);
    questionDiv.appendChild(spreadQuestionDiv);

    questionContainer.appendChild(questionDiv);
}

function createImageScaleButtons(questionText, questionName, options) {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-card image-question";

    const label = document.createElement("div");
    label.className = "question-text";
    label.textContent = questionText;
    questionDiv.appendChild(label);

    const optionsContainer = document.createElement("div");
    optionsContainer.style.display = "grid";
    optionsContainer.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))";
    optionsContainer.style.gap = "20px";
    optionsContainer.style.justifyItems = "center";

    options.forEach((option, index) => {
        const card = document.createElement("div");
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.alignItems = "center";
        card.style.gap = "10px";
        card.style.width = "100%";

        const img = document.createElement("img");
        img.src = option.image;
        img.alt = option.text;
        img.style.width = "100%";
        img.style.maxWidth = "300px";
        img.style.aspectRatio = "612 / 207";
        img.style.border = "1px solid #ccc";
        img.style.borderRadius = "5px";

        const radioInput = document.createElement("input");
        radioInput.type = "radio";
        radioInput.name = questionName;
        radioInput.value = index + 1;
        radioInput.id = `${questionName}_${index}`;
        radioInput.style.display = "none";

        const radioLabel = document.createElement("label");
        radioLabel.htmlFor = `${questionName}_${index}`;
        radioLabel.className = "score-btn-rect";
        radioLabel.style.width = "100%";
        radioLabel.style.textAlign = "center";
        radioLabel.textContent = option.text;

        radioInput.addEventListener('change', function () {
            const allLabels = optionsContainer.querySelectorAll('.score-btn-rect');
            allLabels.forEach(l => l.classList.remove('selected'));
            if (this.checked) radioLabel.classList.add('selected');
        });

        card.appendChild(img);
        card.appendChild(radioInput);
        card.appendChild(radioLabel);

        optionsContainer.appendChild(card);
    });

    questionDiv.appendChild(optionsContainer);
    questionContainer.appendChild(questionDiv);
}

function createIntensityButtons(questionText, questionName) {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-card";

    const label = document.createElement("div");
    label.className = "question-text";
    label.textContent = questionText;
    questionDiv.appendChild(label);

    const intensityOptions = [
        "전혀 없음",
        "거의 없음",
        "약간",
        "중간 정도",
        "심함",
        "매우 심함",
    ];

    const intensityDiv = document.createElement("div");
    intensityDiv.className = "scale-container";
    intensityDiv.style.gap = "10px";

    intensityOptions.forEach((option, index) => {
        const radioInput = document.createElement("input");
        radioInput.type = "radio";
        radioInput.name = questionName;
        radioInput.value = index;
        radioInput.id = `${questionName}_${index}`;
        radioInput.style.display = "none";

        const radioLabel = document.createElement("label");
        radioLabel.htmlFor = `${questionName}_${index}`;
        radioLabel.className = "score-btn-rect";
        radioLabel.textContent = option;

        radioInput.addEventListener('change', function () {
            const allLabels = intensityDiv.querySelectorAll('.score-btn-rect');
            allLabels.forEach(l => l.classList.remove('selected'));
            if (this.checked) radioLabel.classList.add('selected');
        });

        intensityDiv.appendChild(radioInput);
        intensityDiv.appendChild(radioLabel);
    });

    questionDiv.appendChild(intensityDiv);
    questionContainer.appendChild(questionDiv);
}

questions.forEach((question, index) => {
    const questionName = `q${index + 1}`;
    if (question.type === "scale") {
        createScaleButtons(question.text, questionName);
    } else if (question.type === "intensity") {
        createIntensityButtons(question.text, questionName);
    } else if (question.type === "image-scale") {
        createImageScaleButtons(question.text, questionName, question.options);
    } else if (question.type === "image-pair") {
        createImagePairQuestion(question.text, questionName, question.options);
    }
});

const connectionsList = [];
let selectedCheckboxes = [];
let isArrowFunctionEnabled = false;

function handleCheckboxChange(event) {
    const checkbox = event.target;

    if (!isArrowFunctionEnabled) {
        return;
    }

    if (checkbox.checked) {
        selectedCheckboxes.push(checkbox);
        if (selectedCheckboxes.length === 2) {
            if (selectedCheckboxes[0] !== selectedCheckboxes[1]) {
                const existingConnection = connectionsList.find(conn =>
                    (conn.cb1 === selectedCheckboxes[0] && conn.cb2 === selectedCheckboxes[1]) ||
                    (conn.cb1 === selectedCheckboxes[1] && conn.cb2 === selectedCheckboxes[0])
                );
                if (!existingConnection) {
                    const line = drawArrowBetween(selectedCheckboxes[0], selectedCheckboxes[1]);
                    if (line) {
                        connectionsList.push({
                            cb1: selectedCheckboxes[0],
                            cb2: selectedCheckboxes[1],
                            line: line
                        });
                    }
                } else {
                    alert("이미 연결된 항목입니다.");
                }
            }
            selectedCheckboxes = [];
        }
    } else {
        const index = selectedCheckboxes.indexOf(checkbox);
        if (index > -1) {
            selectedCheckboxes.splice(index, 1);
        }
        removeConnectionsInvolvingCheckbox(checkbox);
    }
}

function drawArrowBetween(checkbox1, checkbox2) {
    const pos1 = getCheckboxPosition(checkbox1);
    const pos2 = getCheckboxPosition(checkbox2);

    if (pos1 && pos2) {
        const img1 = checkbox1.closest('.image-container').querySelector('img');
        const img2 = checkbox2.closest('.image-container').querySelector('img');

        const svg1 = checkbox1.closest('.image-container').querySelector('.arrow-svg');

        const container1 = checkbox1.closest('.image-container').getBoundingClientRect();
        const container2 = checkbox2.closest('.image-container').getBoundingClientRect();

        const checkboxRect1 = checkbox1.getBoundingClientRect();
        const checkboxRect2 = checkbox2.getBoundingClientRect();

        const relativeX1 = (parseFloat(pos1.left) / 100) * img1.clientWidth;
        const relativeY1 = (parseFloat(pos1.top) / 100) * img1.clientHeight;

        const relativeX2 = (parseFloat(pos2.left) / 100) * img2.clientWidth;
        const relativeY2 = (parseFloat(pos2.top) / 100) * img2.clientHeight;

        const absoluteX1 = container1.left + relativeX1 + (checkbox1.offsetWidth / 2);
        const absoluteY1 = container1.top + relativeY1 + (checkbox1.offsetHeight / 2);
        const absoluteX2 = container2.left + relativeX2 + (checkbox2.offsetWidth / 2);
        const absoluteY2 = container2.top + relativeY2 + (checkbox2.offsetHeight / 2);

        const svg1Rect = svg1.getBoundingClientRect();

        const shiftLeftPercentage = -1;
        const shiftTopPercentage = -1;

        const shiftX1 = (shiftLeftPercentage / 100) * img1.clientWidth;
        const shiftY1 = (shiftTopPercentage / 100) * img1.clientHeight;

        const shiftX2 = (shiftLeftPercentage / 100) * img2.clientWidth;
        const shiftY2 = (shiftTopPercentage / 100) * img2.clientHeight;

        let finalX1 = absoluteX1 - svg1Rect.left - shiftX1;
        let finalY1 = absoluteY1 - svg1Rect.top - shiftY1;
        let finalX2 = absoluteX2 - svg1Rect.left - shiftX2;
        let finalY2 = absoluteY2 - svg1Rect.top - shiftY2;

        const deltaX = finalX2 - finalX1;
        const deltaY = finalY2 - finalY1;

        const reducedDeltaX = deltaX * 0.7;
        const reducedDeltaY = deltaY * 0.7;

        finalX2 = finalX1 + reducedDeltaX;
        finalY2 = finalY1 + reducedDeltaY;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", finalX1);
        line.setAttribute("y1", finalY1);
        line.setAttribute("x2", finalX2);
        line.setAttribute("y2", finalY2);
        line.classList.add("arrow");

        svg1.appendChild(line);

        return line;
    }
    return null;
}

function getCheckboxPosition(checkbox) {
    const number = checkbox.getAttribute('data-number');
    for (const side in checkboxPositions) {
        const pos = checkboxPositions[side].find(p => p.number == number);
        if (pos) return pos;
    }
    return null;
}

function removeConnectionsInvolvingCheckbox(checkbox) {
    const connectionsToRemove = connectionsList.filter(conn =>
        conn.cb1 === checkbox || conn.cb2 === checkbox
    );

    connectionsToRemove.forEach(conn => {
        if (conn.line && conn.line.parentNode) {
            conn.line.parentNode.removeChild(conn.line);
        }

        const index = connectionsList.indexOf(conn);
        if (index > -1) {
            connectionsList.splice(index, 1);
        }
    });
}

function removeAllConnections() {
    connectionsList.forEach(conn => {
        if (conn.line && conn.line.parentNode) {
            conn.line.parentNode.removeChild(conn.line);
        }
    });
    connectionsList.length = 0;
}

function enableArrowFunctionality() {
    isArrowFunctionEnabled = true;
}

function disableArrowFunctionality() {
    isArrowFunctionEnabled = false;
    selectedCheckboxes = [];
}

async function submitSurvey() {
    // 1. 응답 데이터 수집
    const responses = [];
    const unanswered = [];
    const scoreMapping = { 0: 0, 1: -1, 2: 1, 3: 1, 4: 2, 5: 3 };

    questions.forEach((question, index) => {
        const questionName = `q${index + 1}`;
        const questionId = `Q${index + 1}`;
        let answered = false;
        if (question.type === "scale") {
            const checkedInput = document.querySelector(`input[name="${questionName}"]:checked`);
            if (checkedInput) {
                responses.push({ question: `PDQ_${questionId}`, value: checkedInput.value, score: parseInt(checkedInput.value, 10) });
                answered = true;
            }
        } else if (question.type === "intensity") {
            const checkedInput = document.querySelector(`input[name="${questionName}"]:checked`);
            if (checkedInput) {
                responses.push({ question: `PDQ_${questionId}`, value: checkedInput.value, score: scoreMapping[checkedInput.value] ?? 0 });
                answered = true;
            }
        } else if (question.type === "image-pair") {
            const checkedCheckboxes = document.querySelectorAll(`input[name="PDQ_Q1_checkbox"]:checked`);
            const spreadInput = document.querySelector(`input[name="${questionName}_spread"]:checked`);
            let hasPairData = false;
            if (checkedCheckboxes.length > 0) {
                checkedCheckboxes.forEach(cb => {
                    responses.push({ question: `PDQ_${questionId}_checkbox`, value: cb.value, score: 0 });
                });
                hasPairData = true;
            }
            if (spreadInput) {
                responses.push({ question: `PDQ_${questionId}-1`, value: spreadInput.value, score: spreadInput.value === 'yes' ? -1 : 0 });
                hasPairData = true;
            }
            if (connectionsList.length > 0) {
                connectionsList.forEach(conn => {
                    responses.push({ question: `PDQ_${questionId}_connection`, value: `${conn.cb1.value},${conn.cb2.value}`, score: 0 });
                });
                hasPairData = true;
            }
            if (hasPairData) answered = true;
        } else if (question.type === "image-scale") {
            const checkedInput = document.querySelector(`input[name="${questionName}"]:checked`);
            if (checkedInput) {
                const scoreTable = { '1': 0, '2': 1, '3': 2, '4': 1 };
                responses.push({ question: `PDQ_${questionId}`, value: checkedInput.value, score: scoreTable[checkedInput.value] ?? 0 });
                answered = true;
            }
        }
        if (!answered) {
            unanswered.push(index + 1);
        }
    });

    if (unanswered.length > 0) {
        alert(`모든 문항에 응답해 주세요. (${unanswered.join(", ")}번)`);
        return;
    }

    try {
        const filenameRes = await fetch('/get-patient', { method: 'GET' });
        if (!filenameRes.ok) {
            alert("환자 정보(ID)가 없어 파일명을 생성할 수 없습니다. 이 창을 닫고 문진을 다시 시작해주세요.");
            throw new Error('환자 ID 요청 실패 (HTTP 상태 코드: ' + filenameRes.status + ')');
        }
        const { unique_id } = await filenameRes.json();
        if (!unique_id) {
            alert("서버에서 환자 ID를 받아오지 못했습니다. 이 창을 닫고 문진을 다시 시작해주세요.");
            throw new Error('응답 데이터에 unique_id가 없습니다.');
        }

        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const fileName = `PDQ_${timestamp}_${unique_id}.csv`;

        const dataForChecksum = responses.map(item => ({
            question: item.question,
            value: String(item.value) // value를 문자열로 변환
        }));

        // 1차: question, 2차: value로 정렬
        dataForChecksum.sort((a, b) => {
            if (a.question < b.question) return -1;
            if (a.question > b.question) return 1;
            if (a.value < b.value) return -1;
            if (a.value > b.value) return 1;
            return 0;
        });

        const dataStringForChecksum = JSON.stringify(dataForChecksum);
        const checksum = await sha256(dataStringForChecksum);

        let csvContent = "question,value,score\n";
        responses.forEach(item => {
            let value = String(item.value).includes(',') ? `"${String(item.value).replace(/"/g, '""')}"` : item.value;
            csvContent += `${item.question},${value},${item.score}\n`;
        });

        const payload = {
            filename: fileName,
            content: csvContent,
            responses: responses,
            checksum: checksum
        };

        const response = await fetch('/pdq-submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `서버 오류: ${response.status}`);
        }

        alert("설문 결과가 성공적으로 서버에 저장되었습니다.");
        const win = window.open('', 'patientWindow');
        win.location.href = '/'

    } catch (error) {
        console.error('설문 저장 중 오류 발생:', error);
    }
}

window.addEventListener('resize', () => {
    if (isArrowFunctionEnabled) {
        removeAllConnections();
        connectionsList.length = 0;
        const checkedCheckboxes = document.querySelectorAll(`input[name="PDQ_Q1_checkbox"]:checked`);
        for (let i = 0; i < checkedCheckboxes.length; i += 2) {
            if (checkedCheckboxes[i + 1]) {
                drawArrowBetween(checkedCheckboxes[i], checkedCheckboxes[i + 1]);
                connectionsList.push({
                    cb1: checkedCheckboxes[i],
                    cb2: checkedCheckboxes[i + 1],
                    line: null
                });
            }
        }
    }
});