document.addEventListener("DOMContentLoaded", async function () {
    // 현재 날짜를 YYYY.MM.DD 형식으로 포맷팅
    function formatDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    }

    // SHA-256 해시를 생성하는 비동기 함수
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // input 요소에 현재 날짜 설정 (이미 서버에서 설정되어 있으면 생략 가능)
    const dateInput = document.querySelector('input[name="date"]');
    if (dateInput && !dateInput.value) {
        dateInput.value = formatDate();
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

    // 질문 리스트
    const questions = [
        "Q1. 핀이나 바늘로 찌르듯 따끔거리는 통증입니까?",
        "Q2. 칼이나 송곳으로 후벼 파는 듯한 통증입니까?",
        "Q3. 전기 오르듯이 찌릿찌릿한 통증입니까?",
        "Q4. 화끈거리는 통증입니까?",
        "Q5. 시린 통증입니까?",
        "Q6. 뻐근하거나 묵직한 통증입니까?",
        "Q7. 꽉 죄는 듯한 통증입니까?",
        "Q8. 눌리는 듯한 통증입니까?",
        "Q9. 통증 부위가 가볍게 닿아도 통증이 유발되거나 악화됩니까?",
        "Q10. 누르면 통증이 유발되거나 악화됩니까?",
        "Q11. 차가운 것이 닿으면 통증이 유발되거나 악화됩니까?",
        "Q12. 피가 안 통할 때처럼 저리는 통증입니까?",
        "Q13. 통증 부위가 치과에서 마취한 듯 남의 살 같거나 감각이 둔합니까?",
        "Q14. 면봉 등으로 건드리면 통증부위가 둔하게 느껴지거나 감각이 떨어집니까?",
        "Q15. 바늘 같은 뾰쪽한 물건으로 찌르면 통증부위가 둔하게 느껴지거나 감각이 떨어집니까?",
        "Q16. 통증 부위가 벌레가 기어가는 듯하거나 가렵습니까?",
        "Q17. 통증 부위를 만지면 더 아프게(예민하게) 느껴집니까?",
        "Q18. 통증 부위의 피부색깔이 정상 부분과 다릅니까?",
        "Q19. 통증의 정도가 얼마나 심합니까?",
        "Q20. 통증 때문에 얼마나 힘들거나 불편합니까?",
        "Q21. 평소 견딜 수 없이 아파서 통증 때문에 일상 생활에 지장을 받습니까?",
        "Q22. 날씨에 따라 통증이 심해집니까?"
    ];

    const questionContainer = document.getElementById("questions");

    // 간이 설문 문항 번호 (0-based 인덱스): Q1,Q4,Q13,Q14,Q15 + Q23
    const simpleSurveyIndices = [0, 3, 12, 13, 14]; // 1,4,13,14,15번

    // 질문과 라디오 버튼을 생성하는 함수 (Redesign: Card Style)
    function createScaleButtons(questionText, questionName, index) {
        const questionDiv = document.createElement("div");
        questionDiv.className = "question-card";
        questionDiv.dataset.index = index + 1;

        // 간이 설문 문항이면 simple_list 클래스 추가
        if (simpleSurveyIndices.includes(index)) {
            questionDiv.classList.add("simple_list");
        }

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

        // 0부터 10까지 버튼 및 히든 라디오 생성
        for (let i = 0; i <= 10; i++) {
            // 1. Button
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "score-btn";
            btn.textContent = i;

            // Click handler
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

            // 2. Hidden Radio
            const radioInput = document.createElement("input");
            radioInput.type = "radio";
            radioInput.name = questionName;
            radioInput.value = i;
            radioInput.id = `${questionName}_${i}`;
            hiddenRadios.appendChild(radioInput);
        }

        scaleContainer.appendChild(scaleButtons);
        scaleContainer.appendChild(hiddenRadios);

        // Labels (통증 없음 / 최악의 통증)
        const scaleLabels = document.createElement("div");
        scaleLabels.className = "scale-labels";

        const leftLabel = document.createElement("span");
        leftLabel.textContent = "통증 없음";
        scaleLabels.appendChild(leftLabel);

        const rightLabel = document.createElement("span");
        rightLabel.textContent = "최악의 통증";
        scaleLabels.appendChild(rightLabel);

        scaleContainer.appendChild(scaleLabels);
        questionDiv.appendChild(scaleContainer);
        questionContainer.appendChild(questionDiv);
    }

    questions.forEach((question, index) => {
        createScaleButtons(question, `q${index + 1}`, index);
    });

    // 간이 설문 체크박스 요소 가져오기 (Updated ID)
    const simpleSurveyCheckbox = document.getElementById("simpleModeCheck");

    // Q23, Q24, Q25, Q26 문항 요소 가져오기
    const q23 = document.getElementById("q23");
    const q24 = document.getElementById("q24");
    const q25 = document.getElementById("q25");
    const q26 = document.getElementById("q26");

    // 간이 설문 체크박스 이벤트 핸들러
    if (simpleSurveyCheckbox) {
        simpleSurveyCheckbox.addEventListener("change", function () {
            if (this.checked) {
                // 간이 설문 문항만 표시
                const allQuestions = document.querySelectorAll("#questions .question-card");
                allQuestions.forEach(question => {
                    const index = parseInt(question.dataset.index, 10);
                    if (simpleSurveyIndices.includes(index - 1)) {
                        question.style.display = "block";
                    } else {
                        question.style.display = "none";
                        // 선택된 값 초기화
                        const inputs = question.querySelectorAll("input");
                        inputs.forEach(input => input.checked = false);
                        // Reset buttons visual state
                        const buttons = question.querySelectorAll(".score-btn");
                        buttons.forEach(btn => btn.classList.remove('selected'));
                    }
                });

                // Q23 표시 (간이 설문에 포함)
                if (q23) q23.style.display = "block";

                // Q24, Q25, Q26 숨김 처리
                if (q24) q24.style.display = "none";
                if (q25) q25.style.display = "none";
                if (q26) q26.style.display = "none";

                // Q24, Q25, Q26 응답 초기화
                const specialInputs = [q24, q25].flatMap(q => q ? Array.from(q.querySelectorAll("input[type='radio']")) : []);
                specialInputs.forEach(input => input.checked = false);
                const q26Input = q26 ? q26.querySelector("input[name='q_last4']") : null;
                if (q26Input) q26Input.value = '';

                // Reset visual state for Q23-Q25
                [q23, q24, q25].forEach(q => {
                    if (q) q.querySelectorAll('.score-btn, .score-btn-rect').forEach(btn => btn.classList.remove('selected'));
                });

            } else {
                // 모든 문항 표시
                const allQuestions = document.querySelectorAll("#questions .question-card");
                allQuestions.forEach(question => {
                    question.style.display = "block";
                });

                // Q23, Q24, Q25, Q26 표시
                if (q23) q23.style.display = "block";
                if (q24) q24.style.display = "block";
                if (q25) q25.style.display = "block";
                if (q26) q26.style.display = "block";
            }
        });
    }

    // 날짜, 성명, 성별, 연령 입력 검사 추가
    function checkUserInputs() {
        const dateInputVal = document.querySelector('input[name="date"]').value.trim();
        const nameInput = document.querySelector('input[name="name"]').value.trim();
        const genderInput = document.querySelector('input[name="gender"]:checked');
        const ageInput = document.querySelector('input[name="age"]').value.trim();

        const missingInputs = [];
        if (!dateInputVal) missingInputs.push("날짜");
        if (!nameInput) missingInputs.push("성명");
        if (!genderInput) missingInputs.push("성별");
        if (!ageInput) missingInputs.push("연령");

        if (missingInputs.length > 0) {
            alert(`다음 항목이 입력되지 않았습니다: ${missingInputs.join(", ")}`);
            return false;
        } else {
            return true;
        }
    }

    document.querySelector("form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const isSimpleSurvey = simpleSurveyCheckbox ? simpleSurveyCheckbox.checked : false;

        if (!checkUserInputs()) {
            return;
        }
        try {
            const filenameRes = await fetch('/get-patient', { method: 'GET' });
            if (!filenameRes.ok) {
                alert("환자 정보(ID)가 없어 파일명을 생성할 수 없습니다. 페이지를 다시 열어주세요.");
                throw new Error('파일명 요청 실패');
            }
            const { unique_id } = await filenameRes.json();
            if (!unique_id) {
                alert("환자 ID를 받아오지 못했습니다. 페이지를 다시 열어주세요.");
                throw new Error('unique_id is missing');
            }

            const now = new Date();
            const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);

            const fileName = `NPS_${timestamp}_${unique_id}.csv`;

            let responses = [];
            let unanswered = [];

            if (isSimpleSurvey) {
                // 간이 설문: Q1, Q4, Q13, Q14, Q15, Q23만 수집
                simpleSurveyIndices.forEach(index => {
                    const questionNumber = index + 1;
                    const questionName = `q${questionNumber}`;
                    const checkedOption = document.querySelector(`input[name="${questionName}"]:checked`);
                    if (!checkedOption) {
                        unanswered.push(questionNumber);
                    } else {
                        responses.push({ question: `NPQ_Q${questionNumber}`, value: checkedOption.value });
                    }
                });

                // Q23 추가
                const q23Checked = document.querySelector('input[name="q_last1"]:checked');
                if (!q23Checked) {
                    unanswered.push(23);
                } else {
                    responses.push({ question: `NPQ_Q23`, value: q23Checked.value });
                }
            } else {
                questions.forEach((question, index) => {
                    const questionName = `q${index + 1}`;
                    const checkedOption = document.querySelector(`input[name="${questionName}"]:checked`);
                    if (!checkedOption) {
                        unanswered.push(index + 1);
                    } else {
                        responses.push({ question: `NPQ_Q${index + 1}`, value: checkedOption.value });
                    }
                });

                const specialQuestions = ["q_last1", "q_last2", "q_last3"];
                specialQuestions.forEach((name, index) => {
                    const checkedOption = document.querySelector(`input[name="${name}"]:checked`);
                    if (!checkedOption) {
                        unanswered.push(23 + index);
                    } else {
                        responses.push({ question: `NPQ_Q${23 + index}`, value: checkedOption.value });
                    }
                });

                const q26Input = document.querySelector(`input[name="q_last4"]`);
                if (q26Input && q26Input.value.trim() !== "") {
                    responses.push({ question: "NPQ_Q26", value: q26Input.value.trim() });
                }
            }
            if (unanswered.length > 0) {
                alert(`모든 문항에 응답해 주세요. (${unanswered.join(", ")}번)`);
                return;
            }

            responses.sort((a, b) => a.question.localeCompare(b.question));
            const dataStringForChecksum = JSON.stringify(responses);
            const checksum = await sha256(dataStringForChecksum);

            let csvContent = "question,value\n";
            responses.forEach((item) => {
                const safeValue = typeof item.value === 'string' && item.value.includes(',')
                    ? `"${item.value.replace(/"/g, '""')}"`
                    : item.value;
                csvContent += `${item.question},${safeValue}\n`;
            });

            const payload = {
                filename: fileName,
                content: csvContent,
                responses: responses,
                checksum: checksum
            };

            const submitResponse = await fetch('/nps-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!submitResponse.ok) {
                const errData = await submitResponse.json();
                throw new Error(errData.error || 'Server error');
            }

            alert("제출이 완료되어 저장되었습니다.");
            const win = window.open('', 'patientWindow');
            win.location.href = '/'

        } catch (error) {
            console.error('Error:', error);
        }
    });
});