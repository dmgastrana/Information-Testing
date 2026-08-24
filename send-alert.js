const fs = require('fs');
const path = require('path');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_SENDER = process.env.ALERT_SENDER;
const ALERT_RECIPIENT = process.env.ALERT_RECIPIENT;

// Path to your CSV file
const csvPath = path.join(process.cwd(), 'datatable.csv');

// Parse CSV manually (no csv-parser needed)
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

  // Look for Coverage days left ≤ 60
  const expiringItems = rows.filter(row => {
    const daysLeft = parseInt(row["Coverage days left"], 10);
    return !isNaN(daysLeft) && daysLeft <= 60;
  });

  if (expiringItems.length === 0) {
    console.log("No items expiring soon.");
    return;
  }

  const emailBody = expiringItems
    .map(item => `• ${item["Serial Number"]} — ${item["Coverage days left"]} days left`)
    .join('\n');

  try {
    await sendEmail(`The following items have ≤ 60 days of coverage left:\n\n${emailBody}`);
    console.log("Email sent successfully.");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

run();
