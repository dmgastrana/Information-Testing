document.addEventListener('DOMContentLoaded', () => {

    const csvUrl = 'https://raw.githubusercontent.com/dmgastrana/Information-Test/main/datatable.csv';
    let equipmentData = [];

    // Load CSV
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            equipmentData = results.data;
            localStorage.setItem('equipmentData', JSON.stringify(equipmentData));
            displayResults(equipmentData);
        },
        error: function(error) {
            console.error('Error parsing CSV:', error);
        }
    });

    // Search filters
    document.querySelectorAll('.search-container input').forEach(input => {
        input.addEventListener('input', filterTable);
    });

    // Display table rows
    function displayResults(data) {
        const resultTable = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
        resultTable.innerHTML = '';

        data.forEach(item => {
            const row = resultTable.insertRow();

            Object.entries(item).forEach(([key, val]) => {
                const cell = row.insertCell();

                // Auto-calc Coverage Days Left
                if (key === 'Coverage days left') {

                    let rawEnd = item['Contract/Warranty End'];

                    if (!rawEnd || rawEnd.toLowerCase() === 'n/a') {
                        cell.textContent = 'n/a';
                        cell.style.color = 'gray';

                    } else {
                        let datePart = rawEnd.split(',')[0].trim();
                        let endDate = new Date(datePart);

                        if (isNaN(endDate)) {
                            cell.textContent = 'Invalid Date';
                            cell.style.color = 'red';

                        } else {
                            const today = new Date();
                            const diffTime = endDate - today;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            cell.textContent = diffDays;

                            if (diffDays <= 0) {
                                cell.style.color = 'red';
                            } else if (diffDays <= 30) {
                                cell.style.color = 'orange';
                            } else {
                                cell.style.color = 'green';
                            }
                        }
                    }

                // PDF link for Service Contract
                } else if (key === 'Service Contract') {

                    const serialNumber = item['Serial Number']?.trim() || '';
                    const pdfUrl = `https://raw.githubusercontent.com/dmgastrana/Information-Test/main/${serialNumber}.pdf`;

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

    // Row count
    function updateTotalRowCount(count) {
        document.getElementById('rowCount').textContent = `Total Rows: ${count}`;
    }

    // Filtering
    function filterTable() {
        const serialNumberValue = document.getElementById('serialNumber').value.toLowerCase();
        const makeValue = document.getElementById('make').value.toLowerCase();
        const officeValue = document.getElementById('office').value.toLowerCase();
        const modalityValue = document.getElementById('modality').value.toLowerCase();
        const servicesupportValue = document.getElementById('servicesupport').value.toLowerCase();

        const filteredData = equipmentData.filter(item => {
            return (
                (item['Serial Number'] || '').toLowerCase().includes(serialNumberValue) &&
                (item['Make'] || '').toLowerCase().includes(makeValue) &&
                (item['Office'] || '').toLowerCase().includes(officeValue) &&
                (item['Modality'] || '').toLowerCase().includes(modalityValue) &&
                (item['Service Support'] || '').toLowerCase().includes(servicesupportValue)
            );
        });

        displayResults(filteredData);
    }

    // Vertical modal view
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

    // Close modal
    document.getElementById("closeModal").addEventListener("click", function () {
        document.getElementById("verticalView").style.display = "none";
        document.getElementById("modalOverlay").style.display = "none";
    });

});




