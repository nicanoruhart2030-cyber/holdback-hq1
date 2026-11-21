/*
 * Every fact on the site comes from this file, and only from Fernando's LinkedIn profile.
 * LinkedIn blocks automated reading, so most fields are still empty: the page shows a
 * visible "Add from LinkedIn" marker wherever a field is empty.
 *
 * How to fill it: on LinkedIn open the profile, More -> Save to PDF, and copy each
 * section into the matching field below. Nothing else needs to change.
 */
window.PROFILE = {
  name: "Fernando Uhart",
  linkedin: "https://www.linkedin.com/in/fernando-uhart-08542943/",

  // LinkedIn headline, e.g. the line under the name
  headline: "",
  // City, country as shown on LinkedIn
  location: "",
  // The About section, one string per paragraph
  about: [],

  // Experience, newest first. One object per role:
  // { title: "", company: "", start: "2019", end: "2024" or "Present", location: "", summary: "" }
  experience: [],

  // Education: { school: "", degree: "", start: "", end: "" }
  education: [],

  // Skills, as listed on LinkedIn
  skills: [],

  // Languages: { name: "", level: "" }
  languages: [],

  // Optional public email. Leave empty to show LinkedIn as the only contact.
  email: "",
};
