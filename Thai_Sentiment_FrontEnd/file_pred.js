// Get DOM Element
const fileInput = document.getElementById('file-input');
const fileForm = document.getElementById('file-form');
const summaryDiv = document.getElementById('file-result-summary');
const resultContainer = document.getElementById('result-container');
const resultDiv = document.getElementById('result');
const chartDiv = document.getElementById('chartWrapper')
const metadataDiv = document.getElementById('file-metadata');
const filterCont = document.getElementById('filter-container')
const sentimentFilter = document.getElementById('sentiment-filter');
const keywordFilter = document.getElementById('keyword-filter');
const confidenceFilter = document.getElementById('confidence-filter');
const confidenceValue = document.getElementById('confidence-value');
const exportDiv = document.getElementById('export-buttons');
const exportChartBtn = document.getElementById('export-chart-btn')
const exportCVSBtn = document.getElementById('export-csv-btn');
const loadingIndicator = document.getElementById('loading-indicator');
const submitBtn = fileForm.querySelector('button[type="submit"]');

// Global Variable
let originalData=[];
let sentimentChartInstance;
let confidenceChartInstance;

// Add event listener for form submission
fileForm.addEventListener('submit', async (event) =>{
    event.preventDefault();
    hideAllResults();

    loadingIndicator.classList.remove('hidden');
    submitBtn.disabled = true;

    try{
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        const response = await fetch("http://localhost:8000/sentiment/predict_file", {
            method: "POST",
            body: formData
        });
  

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`HTTP Error! Status: ${response.status}, ข้อความ: ${error.detail}`);            
        }

        const {result} = await response.json();
        originalData = result;

        const filename = fileInput.files[0].name;
        const uploadTime = new Date().toLocaleString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        displayResult(filename, uploadTime);

    } catch (error) {
        resultContainer.classList.remove('hidden');
        resultDiv.innerHTML = `<b style="color: red;">เกิดข้อผิดพลาด: ${escapeHtml(error.message)}</b>`;
    } finally{
        loadingIndicator.classList.add('hidden');
        submitBtn.disabled = false;
    }
});

// Filter event listener
sentimentFilter.addEventListener('change', renderTable);
keywordFilter.addEventListener('input', renderTable);
confidenceFilter.addEventListener('input', () => {
    confidenceValue.textContent = `${confidenceFilter.value}%`;
    renderTable();
})

// Resize handler
window.addEventListener('resize', () => {
    if (sentimentChartInstance) {
        sentimentChartInstance.resize();
    }
    if (confidenceChartInstance) {
        confidenceChartInstance.resize();
    }
});

// Export Chart 
exportChartBtn.addEventListener('click', () => {
    const pieURL = document.getElementById('sentimentChart').toDataURL("image/png");
    const barURL = document.getElementById('confidenceChart').toDataURL("image/png");

    const pieLink = document.createElement('a');
    pieLink.href = pieURL;
    pieLink.download = 'sentiment_pie_chart.png';
    document.body.appendChild(pieLink);
    pieLink.click();
    document.body.removeChild(pieLink);

    const barLink = document.createElement('a');
    barLink.href = barURL;
    barLink.download = 'confidence_bar_chart.png';
    document.body.appendChild(barLink);
    barLink.click();
    document.body.removeChild(barLink);

})

// Export Table
exportCVSBtn.addEventListener('click', () =>{
    const rows = [["ข้อความ", "อารมณ์", "ความมั่นใจ"]];
    const sentiment = sentimentFilter.value;
    const keyword = keywordFilter.value.trim();
    const minConfidence = Number(confidenceFilter.value);

    const filteredData = originalData.filter(item => {
        const probObj = item.probabilities.find(p => p.label === item.sentiment);
        const confidence = probObj ? probObj.probability * 100 : 0;

        const sentimentMatch = sentiment === 'all' || item.sentiment === sentiment;
        const keywordMatch = keyword === '' || item.text.includes(keyword);
        const confidenceMatch = confidence >= minConfidence;
        
        return sentimentMatch && keywordMatch && confidenceMatch;
    });

    // Add row to CSV
    filteredData.forEach(item => {
        const prob = item.probabilities.find(p => p.label === item.sentiment);
        rows.push([item.text, item.sentiment, (prob.probability * 100).toFixed(1) + '%']);
    });

    //Create file and trigger download
    const csvContent = "data:text/cvs;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href",encodeURI(csvContent));
    link.setAttribute("download","sentiment_result.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});


// UI Fuction

function hideAllResults() {
    summaryDiv.classList.add('hidden');
    resultContainer.classList.add('hidden');
    chartDiv.classList.add('hidden');
    metadataDiv.classList.add('hidden');
    exportDiv.classList.add('hidden');
}

function displayResult(filename, uploadTime) {
    const totalRows = originalData.length;
    metadataDiv.innerText = `ไฟล์: ${filename} | ข้อความทั้งหมด: ${totalRows} | อัปโหลด: ${uploadTime}`;
    metadataDiv.classList.remove('hidden');

    renderSummary();
    renderChart();
    renderTable();

    summaryDiv.classList.remove('hidden');
    chartDiv.classList.remove('hidden');
    exportDiv.classList.remove('hidden')
    filterCont.classList.remove('hidden');
    resultContainer.classList.remove('hidden');
}


function renderSummary(){
    const counts = { "เชิงลบ 😡": 0, "เป็นกลาง 😐": 0, "เชิงบวก 😄": 0 };
    originalData.forEach(item => {
        counts[item.sentiment] += 1;
    });
    const total = originalData.length;
    if (total === 0) return;

    summaryDiv.innerHTML = `
        <h2>สรุปผลการวิเคราะห์ไฟล์</h2>
        <ul>
            <li>จำนวนข้อความทั้งหมด: ${total}</li>
            <li>เชิงลบ: ${counts["เชิงลบ 😡"]} (${((counts["เชิงลบ 😡"] / total) * 100).toFixed(1)}%)</li>
            <li>เป็นกลาง: ${counts["เป็นกลาง 😐"]} (${((counts["เป็นกลาง 😐"] / total) * 100).toFixed(1)}%)</li>
            <li>เชิงบวก: ${counts["เชิงบวก 😄"]} (${((counts["เชิงบวก 😄"] / total) * 100).toFixed(1)}%)</li>
        </ul>
    `;
}

function renderChart(){
    const counts = { "เชิงลบ 😡": 0, "เป็นกลาง 😐": 0, "เชิงบวก 😄": 0 };
    const confidenceSums = { "เชิงลบ 😡": 0, "เป็นกลาง 😐": 0, "เชิงบวก 😄": 0 };

    originalData.forEach(item => {
        counts[item.sentiment] += 1;
        const probObj = item.probabilities.find(p => p.label === item.sentiment);
        confidenceSums[item.sentiment] += probObj.probability;
    });

    const avgConfidence = ["เชิงลบ 😡", "เป็นกลาง 😐", "เชิงบวก 😄"].map(label => {
        const total = counts[label];
        return total > 0 ? +(confidenceSums[label] / total * 100).toFixed(1) : 0;
    });

    if (sentimentChartInstance) sentimentChartInstance.destroy();
    if (confidenceChartInstance) confidenceChartInstance.destroy();
    const sentimentCanvas = document.getElementById('sentimentChart');
    const confidenceCanvas = document.getElementById('confidenceChart');

    const pieCtx = sentimentCanvas.getContext('2d');
    
    sentimentChartInstance = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ["เชิงลบ 😡", "เป็นกลาง 😐", "เชิงบวก 😄"],
            datasets: [{
                label: 'สัดส่วนอารมณ์',
                data: [
                    counts["เชิงลบ 😡"],
                    counts["เป็นกลาง 😐"],
                    counts["เชิงบวก 😄"]
                ],
                backgroundColor: ['#ef4444', '#818cf8', '#22c55e'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio:true,
            aspectRatio: 1.2,
            plugins: {
                legend: {position: 'bottom', labels: {font: {size: 14}}},
                title: {display: true, text: 'สัดส่วนอารมณ์จากไฟล์',font:{size: 16}}
            }
        }
    });

    const barCtx = confidenceCanvas.getContext('2d')
    confidenceChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels:["เชิงลบ 😡", "เป็นกลาง 😐", "เชิงบวก 😄"],
            datasets: [{
                label: 'ความมั่นใจเฉลี่ย (%)',
                data: avgConfidence,
                backgroundColor: ['#ef4444', '#818cf8', '#22c55e'] 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio:true,
            aspectRatio: 1.2,
            scales: {y: {beginAtZero: true,
                max: 100,
                title: {display: true, text: 'เปอร์เซ็นต์',labels:{font:{size:14}}}
            } },
            plugins: {
                title: { display: true, text: 'ความมั่นใจเฉลี่ยต่ออารมณ์' , font:{size: 16}},
                legend: { display: false }
            }
        }
    });
}

function renderTable() {
    const sentiment = sentimentFilter.value;
    const keyword = keywordFilter.value.trim();
    const minConfidence = Number(confidenceFilter.value)

    //Filter data part
    const filteredData = originalData.filter(item => {
        const probObj = item.probabilities.find(p => p.label === item.sentiment);
        const confidence = probObj ? probObj.probability * 100 : 0;

        const sentimentMatch = sentiment === 'all' || item.sentiment === sentiment;
        const keywordMatch = keyword === '' || item.text.includes(keyword);
        const confidenceMatch = confidence >= minConfidence;
        
        return sentimentMatch && keywordMatch && confidenceMatch;
    });

    let table = `
        <div class="result-table-info">
            Showing ${filteredData.length} of ${originalData.length} results
        </div>
        <table class="result-table">
            <thead>
                <tr>
                    <th>ข้อความ</th>
                    <th>อารมณ์</th>
                    <th>ความมั่นใจ</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (filteredData.length === 0){
        table += `
            <tr><td colspan= "3" style="text-allign: center; padding: 20px;">
                ไม่มีผลการค้นหาที่คุณต้องการ
            </td><tr>
        `
    } else {
        filteredData.forEach(item => {
            const probObj = item.probabilities.find(p => p.label === item.sentiment);
            const pct = (probObj.probability * 100).toFixed(1) + '%';
            table += `
                <tr>
                    <td>${escapeHtml(item.text)}</td>
                    <td>${escapeHtml(item.sentiment)}</td>
                    <td>${pct}</td>
                </tr>
            `;
        });
    }

    table += `
            </tbody>
        </table>
    `;

    resultContainer.innerHTML = table;

}