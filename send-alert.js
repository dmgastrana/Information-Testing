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

// Helper: check if a date is within 30 days
function isExpiringSoon(dateStr) {
  const today = new Date();
  const expDate = new Date(dateStr);

  const diffTime = expDate - today;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays <= 30;
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
      subject: "Expiration Alert",
      text: bodyText
    })
  });

  const data = await response.json();
  console.log("Resend response:", data);
}

async function run() {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(csvContent);

  const expiringItems = rows.filter(row =>
    row.expiration && isExpiringSoon(row.expiration)
  );

  if (expiringItems.length === 0) {
    console.log("No items expiring soon.");
    return;
  }

  const emailBody = expiringItems
    .map(item => `• ${item.name} — expires on ${item.expiration}`)
    .join('\n');

  try {
    await sendEmail(`The following items are expiring soon:\n\n${emailBody}`);
    console.log("Email sent successfully.");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

run();
