# Fernando Uhart: profile site

A static one-page site (HTML, CSS, JS, no build step) built from Fernando's LinkedIn profile:
https://www.linkedin.com/in/fernando-uhart-08542943/

## Filling in the content

Every fact on the page comes from **`profile.js`**, and only from the LinkedIn profile.
LinkedIn blocks automated reading, so most fields are still empty; the page shows an
"Add … from LinkedIn" marker wherever a field is empty, and the illustrations use
neutral placeholder bars instead of invented roles.

1. On LinkedIn, open the profile and choose **More → Save to PDF**.
2. Copy each section into `profile.js`: `headline`, `location`, `about` (one string per
   paragraph), `experience` (newest first: title, company, start, end or "Present",
   location, summary), `education`, `skills`, `languages`, and optionally `email`.
3. Reload. The hero's career-timeline illustration builds itself from the experience
   years, and every marker disappears once its field is filled.

## Running and publishing

Open `index.html` in a browser, or serve the folder with any static host
(Netlify Drop, Vercel, GitHub Pages). There is nothing to build.

## What's in it

- Hero with an animated "career timeline" product scene (stageshow): a cursor visits each
  role and a card shows title, company and years.
- About, Experience, Skills & background.
- Contact with an animated "new message" scene and a LinkedIn button (plus email if set).
- Accessible: skip link, landmarks, visible focus, current-section nav, reduced-motion
  support (scenes become still), 16px+ text, no horizontal scroll down to 320px.
