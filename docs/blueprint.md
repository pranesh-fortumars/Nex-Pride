# **App Name**: NexTirupur.in

## Core Features:

- Secure Role-Based Authentication: Users can authenticate via phone number OTP, with distinct roles for Job Seekers and Employers. Anonymous browsing is allowed, but actions like applying for jobs or posting jobs require login.
- Employer Job Posting & Management: Employers can easily create and manage new job listings, including detailed structured fields like title, category, salary range, location, and requirements. Posted jobs are stored and managed in Firestore.
- Job Seeker Search & Discovery: Job seekers can browse available job postings, utilize category and GPS-based location filters, and view detailed job descriptions to find relevant opportunities.
- One-Click Job Application: Job seekers can apply to desired jobs swiftly with a single click, leveraging their pre-filled profile information, simplifying the application process.
- Applicant Tracking for Employers: Employers are provided with a dashboard to view applications for their posted jobs, with tools to filter candidates by various criteria (age, experience, location), shortlist, and manage application statuses.
- Subscription & Payment Gateway: Integration with Razorpay allows employers to purchase job posting plans (e.g., single job, monthly subscriptions) through secure payment processing, with transactions managed via Firebase Cloud Functions.

## Style Guidelines:

- Primary brand color: Muted slate blue (#476684). This color evokes reliability and professionalism, referencing traditional garment industry materials while maintaining a clean, approachable aesthetic suitable for a trusted local platform.
- Background color: Extremely light, tinted blue-grey (#F0F2F4). Heavily desaturated with the same hue as the primary, this color provides a clean, neutral canvas that enhances readability and minimizes eye strain, aligning with a mobile-first, low-tech user experience.
- Accent color: Warm goldenrod orange (#DCA53C). Analogous to the primary but distinct in brightness and saturation, this accent provides a clear and inviting visual for interactive elements like calls-to-action (CTAs) and important highlights, drawing attention without being overly aggressive.
- The font 'Inter' (sans-serif) will be used throughout the application. Its modern, neutral, and highly readable characteristics make it ideal for both headlines and body text, ensuring clarity and simplicity for a diverse user base, especially on mobile devices.
- Utilize simple, line-based icons that are universally recognizable and support easy navigation for low-tech users. Icons should be clear and sufficiently large to be accessible on small screens.
- Implement a mobile-first, clean, and intuitive layout dominated by single-column designs, generous whitespace, and prominent touch targets for ease of use. A strong visual hierarchy will guide users through tasks with minimal cognitive load.
- Incorporate subtle, purposeful animations primarily for feedback on user actions (e.g., button presses, form submissions). Animations should be fast and lightweight to contribute to a fluid, high-performance mobile experience without causing delays.