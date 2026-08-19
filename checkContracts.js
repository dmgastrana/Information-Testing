const https = require("https");
const { parse } = require("csv-parse");
const nodemailer = require("nodemailer");

// Your CSV file hosted on GitHub
const CSV_URL = "https://raw.githubusercontent.com/dmgastrana/Information/main/datatable.csv";

// Fetch CSV from GitHub
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(data));
        }).on("error", reject);
    });
}

// Extract clean date from messy CSV values
function extractDate(value) {
    if (!value) return null;
    if (value.toLowerCase() === "n/a") return null;

    // Handles cases like: "12/31/2026, after month to month"
    const match = value.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    return match ? match[0] : null;
}

// Calculate days until expiration
function daysUntil(dateStr) {
    if (!dateStr) return null;

    const [month, day, year] = dateStr.split("/").map(Number);
    const end = new Date(year, month - 1, day);
    const today = new Date();

    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
}

// Send email alert
async function sendEmail(subject, message) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject,
        text: message
    });
}

// Main logic
(async () => {
    const csvText = await fetchCSV(CSV_URL);

    parse(csvText, { columns: true, trim: true }, async (err, rows) => {
        if (err) throw err;

        for (const row of rows) {
            const rawEnd = row["Contract/Warranty End"];
            const endDate = extractDate(rawEnd);

            if (!endDate) continue;

            const days = daysUntil(endDate);
            if (!days) continue;

            // Alerts at 90 and 60 days
            if (days === 90 || days === 60) {
                const subject = `${days}-Day Contract Alert: ${row.Modality} – ${row["Serial Number"]}`;
                const message =
                    `Contract/Warranty Expiration Alert\n\n` +
                    `Modality: ${row.Modality}\n` +
                    `Serial Number: ${row["Serial Number"]}\n` +
                    `Office: ${row.Office}\n` +
                    `End Date: ${endDate}\n\n` +
                    `This contract expires in ${days} days.`;

                await sendEmail(subject, message);
            }
        }
    });
})();
