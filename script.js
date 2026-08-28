
document.addEventListener('DOMContentLoaded', () => {

    const csvUrl = 'https://raw.githubusercontent.com/dmgastrana/Information-testing/main/datatable.csv';
    let equipmentData = [];

    function cleanDate(value) {
        if (!value) return null;
        const lower = value.toLowerCase().trim();
        if (lower === "n/a" || lower === "na" || lower === "") return null;
        const datePart = value.split(',')[0].trim();
        const parsed = new Date(datePart);
        return isNaN(parsed) ? null : parsed;
    }

    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            equipmentData = results.data;
            localStorage.setItem('equipmentData', JSON.stringify(equipmentData));
            displayResults(equipmentData);
            runAlerts(equipmentData);
        },
        error: function(error) {
            console.error('Error parsing CSV:', error);
        }
    });

    document.querySelectorAll('.search-container input').forEach(input => {
        input.addEventListener('input', filterTable);
    });

    function displayResults(data) {
        const resultTable = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
        resultTable.innerHTML = '';

        data.forEach(item => {
            const row = resultTable.insertRow();

            Object.entries(item).forEach(([key, val]) => {
                const cell = row.insertCell();

                if (key === 'Coverage days left') {
                    let rawEnd = item['Contract/Warranty End'];
                    let endDate = cleanDate(rawEnd);

                    if (!endDate) {
                        cell.textContent = 'n/a';
                        cell.style.color = 'gray';
                    } else {
                        const today = new Date();
                        const diffTime = endDate - today;
                        const diffDays = Math.ceil(diffTime / 86400000);
                        cell.textContent = diffDays;

                        if (diffDays <= 0) cell.style.color = 'red';
                        else if (diffDays <= 30) cell.style.color = 'orange';
                        else cell.style.color = 'green';
                    }

                } else if (key === 'Service Contract') {

                    const serialNumber = item['Serial Number']?.trim() || '';
                    const pdfUrl = `https://raw.githubusercontent.com/dmgastrana/Information-testing/main/${serialNumber}.pdf`;

                    if (serialNumber) {
                        fetch(pdfUrl, { method: 'HEAD' })
                            .then(response => {
                                if (response.ok) {
                                    cell.innerHTML = `<a href="${pdfUrl}" target="_blank" class="service-contract-link">View PDF</a>`;
                                } else {
                                    cell.textContent = "";
                                }
                            })
                            .catch(() => cell.textContent = "");
                    } else {
                        cell.textContent = "";
                    }

                } else {
                    cell.textContent = val || '';
                    cell.setAttribute('tabindex', '0');
                }
            });

            row.addEventListener("click", handleRowClick);
        });

        updateTotalRowCount(data.length);
    }

    function updateTotalRowCount(count) {
        document.getElementById('rowCount').textContent = `Total Rows: ${count}`;
    }

    function filterTable() {
        const serialNumberValue = document.getElementById('serialNumber').value.toLowerCase();
        const makeValue = document.getElementById('make').value.toLowerCase();
        const officeValue = document.getElementById('office').value.toLowerCase();
        const modalityValue = document.getElementById('modality').value.toLowerCase();
        const servicesupportValue = document.getElementById('servicesupport').value.toLowerCase();
        const contractEndValue = document.getElementById('contractEnd').value.toLowerCase();

        const filteredData = equipmentData.filter(item => {
            return (
                (item['Serial Number'] || '').toLowerCase().includes(serialNumberValue) &&
                (item['Make'] || '').toLowerCase().includes(makeValue) &&
                (item['Office'] || '').toLowerCase().includes(officeValue) &&
                (item['Modality'] || '').toLowerCase().includes(modalityValue) &&
                (item['Service Support'] || '').toLowerCase().includes(servicesupportValue) &&
                (item['Contract/Warranty End'] || '').toLowerCase().includes(contractEndValue)
            );
        });

        displayResults(filteredData);
    }

    function handleRowClick(event) {
        const row = event.target.closest("tr");
        const headers = Array.from(document.querySelectorAll("#resultTable th"));
        const data = Array.from(row.children);
        const verticalDataContainer = document.getElementById("verticalData");

        verticalDataContainer.innerHTML = "";

        headers.forEach((header, index) => {
            const headerText = header.textContent;
            const dataCell = data[index];

            if (headerText === 'Service Contract' && dataCell.querySelector('a')) {
                verticalDataContainer.innerHTML += `
                    <tr>
                        <th>${headerText}</th>
                        <td><a href="${dataCell.querySelector('a').href}" target="_blank">View PDF</a></td>
                    </tr>
                `;
            } else {
                verticalDataContainer.innerHTML += `
                    <tr>
                        <th>${headerText}</th>
                        <td>${dataCell.textContent}</td>
                    </tr>
                `;
            }
        });

        document.getElementById("verticalView").style.display = "block";
        document.getElementById("modalOverlay").style.display = "block";
    }

    document.getElementById("closeModal").addEventListener("click", function () {
        document.getElementById("verticalView").style.display = "none";
        document.getElementById("modalOverlay").style.display = "none";
    });

    function runAlerts(data) {
        let alertItems = [];

        data.forEach(item => {
            let rawEnd = item['Contract/Warranty End'];
            let endDate = cleanDate(rawEnd);

            if (!endDate) return;

            const today = new Date();
            const diffDays = Math.ceil((endDate - today) / 86400000);

            if (diffDays <= 60 && diffDays > 0) {

                alertItems.push(`
<div class="alert-entry">
<b>Serial Number:</b> ${item['Serial Number']}<br>
<span class="blue-label">Make:</span> ${item['Make']}<br>
<span class="blue-label">Office:</span> ${item['Office']}<br>
<b>Modality:</b> ${item['Modality']}<br>
<b>Room:</b> ${item['Room']}<br>
<span class="blue-label">Equipment:</span> ${item['Equipment']}<br>
<b>Contract Begin:</b> ${item['Contract/Warranty Begin']}<br>
<span class="blue-label">Contract End:</span> ${item['Contract/Warranty End']}<br>
<b>Coverage days left:</b> ${diffDays}<br>
<b>Service Support:</b> ${item['Service Support']}<br>
<b>Support Phone#:</b> ${item['Support Phone#']}<br>
<b>Support Email:</b> ${item['Support Email']}<br>
</div>
<hr>
                `);
            }
        });

        if (alertItems.length > 0) {
            const popup = document.getElementById("alertPopup");
            const content = document.getElementById("alertContent");

            content.innerHTML = `<h3 class="alert-header">⚠ Contract/Warranty Expiring Soon (≤ 60 days)</h3>` + alertItems.join("");
            popup.classList.remove("hidden");
        }
    }

    document.getElementById("alertClose").addEventListener("click", function () {
        document.getElementById("alertPopup").classList.add("hidden");
    });

    // ⭐ UPDATED EXPORT — exports the visible HTML table
    document.getElementById("exportBtn").addEventListener("click", () => {
        const table = document.getElementById("resultTable");
        let csv = [];

        const rows = table.querySelectorAll("tr");
        rows.forEach(row => {
            const cols = row.querySelectorAll("th, td");
            const rowData = [];

            cols.forEach(col => {
                const link = col.querySelector("a");
                if (link) {
                    rowData.push("View PDF");
                } else {
                    rowData.push(col.innerText);
                }
            });

            csv.push(rowData.join(","));
        });

        const blob = new Blob([csv.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "datatable.csv";
        a.click();

        URL.revokeObjectURL(url);
    });

});
