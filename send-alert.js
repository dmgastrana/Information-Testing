const fs = require('fs');
const path = require('path');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_SENDER = process.env.ALERT_SENDER;
const ALERT_RECIPIENT = process.env.ALERT_RECIPIENT;

// Path to your CSV file
const csvPath = path.join(process.cwd(), 'datatable.csv');

// Parse CSV manually
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      row[h.trim()] = values[i]?.trim();
    });
    return row;
  });
}

async function sendEmail(bodyText) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: ALERT_SENDER,
      to: ALERT_RECIPIENT,
      subject: "Contract/Warranty Expiring Soon",
      text: bodyText
    })
  });

  const data = await response.json();
  console.log("Resend response:", data);
}

async function run() {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(csvContent);

  // Match website logic: compute days left from Contract/Warranty End
  const expiringItems = rows.filter(row => {
    const rawEnd = row["Contract/Warranty End"];
    if (!rawEnd) return false;

    const endDate = new Date(rawEnd.split(',')[0].trim());
    if (isNaN(endDate)) return false;

    const today = new Date();
    const diffDays = Math.ceil((endDate - today) / 86400000);

    return diffDays <= 60 && diffDays > 0;
  });

  if (expiringItems.length === 0) {
    console.log("No items expiring soon.");
    return;
  }

  // Build full detailed email body
  const emailBody = expiringItems
    .map(item => {
      const rawEnd = item["Contract/Warranty End"];
      const endDate = new Date(rawEnd.split(',')[0].trim());
      const diffDays = Math.ceil((endDate - new Date()) / 86400000);

      return `
Contract/Warranty Expiring Soon (≤ 60 days)

Serial Number: ${item["Serial Number"]}
Make: ${item["Make"]}
Office: ${item["Office"]}
Modality: ${item["Modality"]}
Room: ${item["Room"]}
Equipment: ${item["Equipment"]}
Contract Begin: ${item["Contract/Warranty Begin"]}
Contract End: ${item["Contract/Warranty End"]}
Coverage days left: ${diffDays}
Service Support: ${item["Service Support"]}
Support Phone#: ${item["Support Phone#"]}
Support Email: ${item["Support Email"]}

---------------------------------------------
`;
    })
    .join("\n");

  try {
    await sendEmail(emailBody);
    console.log("Email sent successfully.");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

run();
