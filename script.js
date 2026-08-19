document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'https://raw.githubusercontent.com/dmgastrana/Information/main/datatable.csv';
    let equipmentData = [];

    console.log('Fetching CSV from URL:', csvUrl);

    // Parse the CSV using PapaParse
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            console.log('Parsed CSV data:', results.data);
            equipmentData = results.data;
            localStorage.setItem('equipmentData', JSON.stringify(equipmentData));
            displayResults(equipmentData);
        },
        error: function(error) {
            console.error('Error parsing CSV:', error);
        }
    });

    // Event listeners for search inputs
    document.querySelectorAll('.search-container input').forEach(input => {
        input.addEventListener('input', filterTable);
    });

    // Function to display the table rows
    function displayResults(data) {
        console.log('Displaying results:', data);
        const resultTable = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
        resultTable.innerHTML = ''; // Clear existing rows

        data.forEach(item => {
            const row = resultTable.insertRow(); // Add new row for each data item
            Object.entries(item).forEach(([key, val]) => {
                const cell = row.insertCell();

                if (key === 'Service Contract') {
                    const serialNumber = item['Serial Number']?.trim() || ''; // Get Serial Number
                    const pdfUrl = `https://raw.githubusercontent.com/dmgastrana/Information/main/${serialNumber}.pdf`; // Construct PDF URL

                    if (serialNumber) {
                        // Check if the PDF exists before adding "View PDF" link
                        fetch(pdfUrl, { method: 'HEAD' })
                            .then(response => {
                                if (response.ok) {
                                    cell.innerHTML = `<a href="${pdfUrl}" target="_blank" class="service-contract-link">View PDF</a>`;
                                } else {
                                    cell.textContent = ""; // Leave blank if no PDF exists
                                }
                            })
                            .catch(error => {
                                console.error('Error checking PDF:', error);
                                cell.textContent = ""; // Handle errors gracefully
                            });
                    } else {
                        cell.textContent = ""; // Leave blank if Serial Number is missing
                    }
                } else {
                    cell.textContent = val || ''; // Populate other cells with data
                    cell.setAttribute('tabindex', '0'); // Add tab indexing for accessibility
                }
            });

            row.addEventListener("click", handleRowClick); // Add row click event for details view
        });

        updateTotalRowCount(data.length); // Update row count
    }

    // Update total row count display function
    function updateTotalRowCount(count) {
        const rowCountElement = document.getElementById('rowCount');
        rowCountElement.textContent = `Total Rows: ${count}`;
    }

    // Filter rows based on search input
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

        displayResults(filteredData); // Re-render the table with filtered data
    }

    // Handle row click to open the vertical details view
    function handleRowClick(event) {
        const row = event.target.closest("tr");
        const headers = Array.from(document.querySelectorAll("#resultTable th"));
        const data = Array.from(row.children);
        const verticalDataContainer = document.getElementById("verticalData");

        verticalDataContainer.innerHTML = ""; // Clear previous data

        headers.forEach((header, index) => {
            const headerText = header.textContent;
            const dataCell = data[index];

            if (headerText === 'Service Contract' && dataCell.querySelector('a')) {
                verticalDataContainer.innerHTML += `
                    <tr>
                        <th>${headerText}</th>
                        <td><a href="${dataCell.querySelector('a').href}" target="_blank" class="service-contract-link">View PDF</a></td>
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

        // Show the modal for vertical details view
        document.getElementById("verticalView").style.display = "block";
        document.getElementById("modalOverlay").style.display = "block";
    }

    // Close modal function
    document.getElementById("closeModal").addEventListener("click", function () {
        document.getElementById("verticalView").style.display = "none";
        document.getElementById("modalOverlay").style.display = "none";
    });
});




