// Get DOM Element
const input_text = document.getElementById('input-text');
const textForm = document.getElementById('sentiment-form');
const resultContainer = document.getElementById('result-container');
const result = document.getElementById('result');

// Add event listener for form submission
textForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    // Hide and clear old result
    resultContainer.classList.add('hidden');
    result.innerHTML = '';
    // Get user input
    const text = input_text.value;

    try {
        const response = await fetch("http://localhost:8000/sentiment/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`HTTP Error! Status: ${response.status}, ข้อความ: ${error.detail}`);
        }

        const data = await response.json();
        displayResult(data);

    } catch (error) {
        resultContainer.classList.remove('hidden');
        result.innerHTML = `<b style="color: red;">เกิดข้อผิดพลาด: ${escapeHtml(error.message)}</b>`;
    }
});
        
function displayResult(data){
    // Color of each bar
    const colorMap = {
        "เชิงลบ 😡": "#ef4444",     
        "เป็นกลาง 😐": "#818cf8",   
        "เชิงบวก 😄": "#22c55e"     
    };

    // Result
    let html = `
        <p><b>ข้อความ:</b> ${escapeHtml(data.text)}</p>
        <p><b>อารมณ์:</b> ${escapeHtml(data.sentiment)}</p>
        <hr>
        <p>${escapeHtml(data.summary)}</p>
        <div class="confidence-bar-group">
        `;

    // Probabilites Bar
    data.probabilities.forEach(p => {
        const pct = (p.probability * 100).toFixed(1);
        html += `
        <div class="bar-row">
            <div class="bar-label">${escapeHtml(p.label)}</div>
            <div class="bar">
                <div class="bar-fill" style="width: ${pct}%; background: ${colorMap[p.label]};"></div>
            </div>
            <div class="percent-label">${pct}%</div>
        </div>
        `;
    });
    html += "</div>";
    
    resultContainer.classList.remove('hidden');
    result.innerHTML = html;
}
