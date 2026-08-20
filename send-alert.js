import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';
import csv from 'csv-parser';

const resend = new Resend(process.env.RESEND_API_KEY);

// Path to your CSV file
const csvPath = path.join(process.cwd(), 'datatable.csv');

// Helper: check if a date is within 30 days
function isExpiringSoon(dateStr) {
  const today = new Date();
  const expDate = new Date(dateStr);

  const diffTime = expDate - today;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays <= 30;
}

async function run() {
  const expiringItems = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      if (row.expiration && isExpiringSoon(row.expiration)) {
        expiringItems.push(row);
      }
    })
    .on('end', async () => {
      if (expiringItems.length === 0) {
        console.log("No items expiring soon.");
        return;
      }

      const emailBody = expiringItems
        .map(item => `• ${item.name} — expires on ${item.expiration}`)
        .join('\n');

      try {
        await resend.emails.send({
          from: process.env.ALERT_SENDER,
          to: process.env.ALERT_RECIPIENT,
          subject: "Expiration Alert",
          text: `The following items are expiring soon:\n\n${emailBody}`
        });

        console.log("Email sent successfully.");
      } catch (error) {
        console.error("Error sending email:", error);
      }
    });
}

run();
