# MAHE Facility Management System

A web-based facility inspection and reporting system for Manipal Academy of Higher Education. Built to replace manual WhatsApp and paper-based workflows with a structured digital process. Marshals submit daily inspection reports, admins review and action them, and the director receives an automated summary every evening.

Link:
https://mahe-fac-fys.vercel.app/

---

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (facility images)
- **Authentication:** Supabase Auth (admin only)
- **Email:** Nodemailer with Gmail SMTP
- **Reports:** PDFKit (PDF generation), ExcelJS (spreadsheet generation)
- **Deployment:** Vercel
- **Offline Support:** IndexedDB queue with auto-sync

---

## How It Works

### Marshal

Marshals are the facility inspectors assigned to specific blocks and floors each day.

1. Navigate to the Marshal Portal and log in with a Marshal ID and name
2. Select the block and floor being inspected
3. Complete the 19 item daily inspection checklist across four categories: Daily Observations, Classroom and Lab Upkeep, Washroom and Utility, and Maintenance
4. Declare whether any issues were found during the inspection
5. If issues exist, add each one with an issue type, description, room location, and photos
6. Submit the report before 6:00 PM

The form auto-saves every 10 seconds so progress is not lost if the browser is closed. If the device goes offline, the submission is queued and sent automatically when the connection is restored. The form locks at 6:15 PM after a 15-minute grace period.

---

### Admin

Admins access the dashboard after the 6:00 PM deadline to review the day's submissions.

1. Log in at the admin login page with an email and password
2. View the floor coverage alert which highlights any blocks or floors that were not inspected
3. Browse all submitted issues filtered by status or block
4. Approve or deny each issue using the quick action buttons on each card
5. View photos attached to issues directly in the dashboard gallery
6. Generate a PDF and Excel report for the day, either downloading it directly or emailing it to the director
7. View analytics including top issue types, most problematic locations, and marshal activity over the past 30 days

---

### Director

The director receives an automated email every day at 6:00 PM with two attachments:

- A PDF report with a professional summary, executive statistics, and tables of all approved and denied issues
- An Excel spreadsheet with the same data in a filterable format across four sheets: Summary, All Issues, Approved Issues, and Denied Issues

No login or action is required from the director. The report is delivered automatically as long as at least one issue was submitted that day.

---

## Automated Tasks

Two scheduled tasks run daily without any manual intervention:

- **6:00 PM IST** — Generates and emails the daily report to the director
- **2:00 AM IST** — Cleans up data older than 48 hours including issues, checklist responses, floor coverage records, and stored images. Marshal activity statistics are preserved permanently before deletion to power the admin analytics chart.

---

## Blocks and Floors

The system covers five academic blocks:

| Block | Floors |
|-------|--------|
| AB1   | 0, 1, 2, 3, 4, 5 |
| AB2   | 1, 2, 3, 4, 5, 6 |
| AB3   | 1, 2, 3, 4, 5, 6 |
| AB4   | 1, 2, 3, 4, 5, 6 |
| AB5   | 1, 2, 3, 4, 5, 6 |

---

## Deployment

The project is deployed on Vercel and connected to the GitHub repository. Any push to the `main` branch automatically triggers a redeployment. Environment variables are managed separately in the Vercel dashboard and require a manual redeploy when changed.

---

## Data Retention

Raw issue and inspection data is kept for 48 hours. Images stored in Supabase Storage follow the same retention window. Aggregated analytics and marshal registry data are retained permanently and are not affected by the nightly cleanup.
