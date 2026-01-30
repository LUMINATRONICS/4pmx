document.addEventListener("DOMContentLoaded", async function () {
    const skipSection = document.getElementById("skip-section");
    const dropdownButton = document.getElementById("dropdown-button");
    const skipCheckbox = document.getElementById("skip-questions");

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

    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function formatDate() {
        const today = new Date();
        return `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    }

    document.querySelector('input[name="date"]').value = formatDate();

    // Q1~Q17 질문 텍스트 배열 (Q16, Q17 포함)
    const questions = [
        "Q1. 욱신거리는 통증입니까?",
        "Q2. 쏘는듯한 통증입니까?",
        "Q3. 칼로찌르는듯한 통증입니까?",
        "Q4. 날카로운듯한 통증입니까?",
        "Q5. 쥐어짜는듯한 통증입니까?",
        "Q6. 성가시는 통증입니까?",
        "Q7. 타는듯한 통증입니까?",
        "Q8. 따가운 통증입니까?",
        "Q9. 묵직한 통증입니까?",
        "Q10. 민감한 통증입니까?",
        "Q11. 찢어지는듯한 통증입니까?",
        "Q12. 지치고무기력한 통증입니까?",
        "Q13. 미식거리는 통증입니까?",
        "Q14. 두려운 통증입니까?",
        "Q15. 혹독한벌을 받는듯한 통증입니까?",
        "Q16. 최근 여러분이 느끼는 평상 시 통증이 어느 정도 인지를 아래 선 위에 표시해 주세요.",
        "Q17. 지금 여러분의 통증은 얼마나 심합니까?"
    ];

    const container = document.getElementById("mpqQuestions");

    // 각 질문을 question div로 생성
    questions.forEach((text, idx) => {
        const questionDiv = document.createElement("div");
        questionDiv.className = "question-card";
        questionDiv.dataset.index = idx + 1;

        const label = document.createElement("div");
        label.className = "question-text";
        label.textContent = text;
        questionDiv.appendChild(label);

        // Q1~Q15: 0~10 라디오 스케일
        if (idx < 15) {
            const scaleContainer = document.createElement("div");
            scaleContainer.className = "scale-container";

            const scaleButtons = document.createElement("div");
            scaleButtons.className = "scale-buttons";
            scaleButtons.id = `q${idx + 1}-scale`;

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
                const input = document.createElement("input");
                input.type = "radio";
                input.name = `q${idx + 1}`;
                input.value = i;
                input.id = `q${idx + 1}_${i}`;
                hiddenRadios.appendChild(input);
            }

            scaleContainer.appendChild(scaleButtons);
            scaleContainer.appendChild(hiddenRadios);

            // Labels
            const scaleLabels = document.createElement("div");
            scaleLabels.className = "scale-labels";

            const left = document.createElement("span");
            left.textContent = "통증 없음";
            scaleLabels.appendChild(left);

            const right = document.createElement("span");
            right.textContent = "극심한 통증";
            scaleLabels.appendChild(right);

            scaleContainer.appendChild(scaleLabels);
            questionDiv.appendChild(scaleContainer);
        }
        // Q16: range 슬라이더 + 값 표시
        else if (idx === 15) {
            const scaleContainer = document.createElement("div");
            scaleContainer.className = "scale-container";

            const scaleLabels = document.createElement("div");
            scaleLabels.className = "scale-labels";

            const left = document.createElement("span");
            left.textContent = "통증 없음";
            scaleLabels.appendChild(left);

            const right = document.createElement("span");
            right.textContent = "극도로 심한 통증";
            scaleLabels.appendChild(right);

            scaleContainer.appendChild(scaleLabels);

            const rangeInput = document.createElement("input");
            rangeInput.type = "range";
            rangeInput.min = 0;
            rangeInput.max = 10;
            rangeInput.step = 1;
            rangeInput.name = "q16";
            rangeInput.id = "q16";
            rangeInput.value = 0;
            rangeInput.style.width = "100%";
            rangeInput.style.marginTop = "15px";

            const valueSpan = document.createElement("span");
            valueSpan.id = "q16Value";
            valueSpan.style.display = "block";
            valueSpan.style.textAlign = "center";
            valueSpan.style.marginTop = "10px";
            valueSpan.style.fontSize = "1.2rem";
            valueSpan.style.fontWeight = "bold";
            valueSpan.style.color = "var(--primary)";
            valueSpan.textContent = "0";

            rangeInput.addEventListener('input', () => {
                valueSpan.textContent = rangeInput.value;
            });

            scaleContainer.appendChild(rangeInput);
            scaleContainer.appendChild(valueSpan);
            questionDiv.appendChild(scaleContainer);
        }
        // Q17: 0~5 라디오 버튼 + 텍스트 (Vertical List)
        else if (idx === 16) {
            const scaleContainer = document.createElement("div");
            scaleContainer.className = "scale-container";

            const levels = [
                "0 통증 없음",
                "1 가벼운 통증",
                "2 불편한 정도의 통증",
                "3 고통스러운 정도의 통증",
                "4 무섭게 심한 통증",
                "5 더 이상 견디기 힘든 통증"
            ];

            levels.forEach((levelText, i) => {
                // Hidden Radio
                const radio = document.createElement("input");
                radio.type = "radio";
                radio.name = "q17";
                radio.value = i;
                radio.id = `q17_${i}`;
                radio.style.display = "none";

                // Button Label
                const btn = document.createElement("label");
                btn.htmlFor = `q17_${i}`;
                btn.className = "score-btn-rect";
                btn.textContent = levelText;

                radio.addEventListener('change', function () {
                    const allBtns = scaleContainer.querySelectorAll('.score-btn-rect');
                    allBtns.forEach(b => b.classList.remove('selected'));
                    if (this.checked) btn.classList.add('selected');
                });

                scaleContainer.appendChild(radio);
                scaleContainer.appendChild(btn);
            });

            questionDiv.appendChild(scaleContainer);
        }

        container.appendChild(questionDiv);
    });

    // 열기/닫기 토글 (Optional, but kept for compatibility if needed, though hidden in new design)
    if (dropdownButton) {
        dropdownButton.addEventListener("click", () => skipSection.classList.toggle("show"));
    }

    // 생략 체크 시 질문 비활성화
    if (skipCheckbox) {
        skipCheckbox.addEventListener("change", function () {
            const allInputs = document.querySelectorAll("#mpqQuestions input");
            const allButtons = document.querySelectorAll("#mpqQuestions button");

            allInputs.forEach(input => {
                input.disabled = this.checked;
                if (this.checked) input.checked = false;
            });

            allButtons.forEach(btn => {
                btn.disabled = this.checked;
                if (this.checked) btn.classList.remove('selected');
            });

            // Reset range slider
            const range = document.getElementById('q16');
            if (range && this.checked) {
                range.value = 0;
                document.getElementById('q16Value').textContent = "0";
            }
        });
    }

    // 사용자 입력 확인
    function checkUserInputs() {
        const date = document.querySelector('input[name="date"]').value.trim();
        const name = document.querySelector('input[name="name"]').value.trim();
        const gender = document.querySelector('input[name="gender"]:checked');
        const age = document.querySelector('input[name="age"]').value.trim();

        const missing = [];
        if (!date) missing.push("날짜");
        if (!name) missing.push("성명");
        if (!gender) missing.push("성별");
        if (!age) missing.push("연령");

        if (missing.length > 0) {
            alert(`다음 항목이 입력되지 않았습니다: ${missing.join(", ")}`);
            return false;
        }
        return true;
    }

    // 제출 시
    document.querySelector("form").addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!checkUserInputs()) return;

        try {
            const filenameRes = await fetch('/get-patient', { method: 'GET' });
            if (!filenameRes.ok) {
                alert("환자 정보(ID)가 없어 파일명을 생성할 수 없습니다. 이 창을 닫고 문진을 다시 시작해주세요.");
                throw new Error('환자 ID 요청 실패 (HTTP 상태 코드: ' + filenameRes.status + ')');
            }

            const patientData = await filenameRes.json();
            const unique_id = patientData.unique_id;

            if (!unique_id) {
                alert("서버에서 환자 ID를 받아오지 못했습니다. 이 창을 닫고 문진을 다시 시작해주세요.");
                throw new Error('응답 데이터에 unique_id가 없습니다.');
            }

            const skip = skipCheckbox ? skipCheckbox.checked : false;
            const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
            const fileName = `MPQ_${timestamp}_${unique_id}.csv`;

            let responses = [];
            let unanswered = [];

            if (!skip) {
                for (let i = 0; i < questions.length; i++) {
                    const questionId = `MPQ_Q${i + 1}`;
                    let value = null;
                    if (i < 15) {
                        const selected = document.querySelector(`input[name="q${i + 1}"]:checked`);
                        if (!selected) unanswered.push(i + 1);
                        else value = selected.value;
                    } else if (i === 15) {
                        const q16 = document.querySelector('input[name="q16"]');
                        if (q16 && q16.value !== "") value = q16.value;
                        else unanswered.push(16);
                    } else if (i === 16) {
                        const q17 = document.querySelector('input[name="q17"]:checked');
                        if (q17) value = q17.value;
                        else unanswered.push(17);
                    }
                    if (value !== null) {
                        responses.push({ question: questionId, value: value });
                    }
                }

                if (unanswered.length > 0) {
                    alert(`모든 문항에 응답해 주세요. (${unanswered.join(", ")}번 문항)`);
                    return;
                }
            }

            // 1. question과 value만 추출하고 value는 문자열로 변환
            const dataForChecksum = responses.map(item => ({
                question: item.question,
                value: String(item.value) // 서버와 동일하게 문자열로 변환
            }));

            // 2. 서버와 동일한 방식으로 2단계 정렬
            dataForChecksum.sort((a, b) => {
                // 1차: question으로 정렬
                if (a.question < b.question) return -1;
                if (a.question > b.question) return 1;

                // 2차: question이 같으면 value로 정렬
                if (a.value < b.value) return -1;
                if (a.value > b.value) return 1;

                return 0;
            });

            // 3. 정렬된 데이터를 JSON 문자열로 변환
            const dataStringForChecksum = JSON.stringify(dataForChecksum);
            const checksum = await sha256(dataStringForChecksum);

            let csvContent = "question,value\n";
            // CSV 생성 시에는 기존 responses 사용 (정렬되지 않은 원래 순서 유지 가능)
            responses.sort((a, b) => {
                const numA = parseInt(a.question.split('_Q')[1], 10);
                const numB = parseInt(b.question.split('_Q')[1], 10);
                return numA - numB;
            }).forEach(item => {
                csvContent += `${item.question},${item.value}\n`;
            });

            const payload = {
                filename: fileName,
                content: csvContent,
                responses: responses, // 서버 전송 시에는 원본 데이터 전송
                checksum: checksum
            };

            const res = await fetch('/mpq-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '서버 저장 중 오류가 발생했습니다.');
            }

            alert("제출이 완료되어 저장되었습니다.");
            const win = window.open('', 'patientWindow');
            win.location.href = '/'

        } catch (error) {
            console.error("MPQ 제출 과정에서 오류 발생:", error);
        }
    });
});