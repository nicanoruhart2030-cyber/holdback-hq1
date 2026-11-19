# Fernando Uhart · DJ website

A static site (HTML, CSS, JS, no build step). Open `index.html` in a browser, or deploy the folder to any static host (Netlify, Vercel, GitHub Pages).

## Before going live

1. **Photo:** save the photo of Fernando behind the decks as `images/fernando-decks.jpg` (portrait, about 4:5, at least 1000px wide). Until then the hero shows an illustrated placeholder.
2. **WhatsApp and Instagram:** set at the top of `script.js` (`WHATSAPP_NUMBER`, international format, digits only; `INSTAGRAM_URL`). Currently +1 365 739 8284 and @fernandouhart.
3. **Booking form:** there is no backend. Submitting the form writes the request as a WhatsApp message and shows a "Send on WhatsApp" button; nothing is sent until the visitor taps it. To receive requests by email instead, connect the form to a service such as Formspree.
