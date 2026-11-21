/*
 * Every fact on the site comes from this file, taken from Fernando's LinkedIn profile:
 * https://www.linkedin.com/in/fernando-uhart-08542943/
 * Empty fields show an "Add ... from LinkedIn" marker on the page (location is simply hidden).
 */
window.PROFILE = {
  name: "Fernando Uhart",
  linkedin: "https://www.linkedin.com/in/fernando-uhart-08542943/",

  // Built from the Experience section (his exact LinkedIn headline was not provided)
  headline: "Director at Growfit Inc. · Former SVP, Scotiabank",
  location: "",

  // From the "What I'm focused on" statement of his Growfit Inc. role
  about: [
    "Through my advisory work and as founder of Growfit Inc., I partner with financial institutions, fintechs, and service organizations to help them simplify operations, scale efficiently, and embed digital and AI capabilities into their core business, with a strong focus on execution and measurable results.",
  ],

  // Numbers stated on the profile
  highlights: [
    { value: "26", unit: "years", label: "at Scotiabank, across six countries" },
    { value: "USD 200MM", label: "core systems modernization led at BNS Colombia" },
    { value: "2,400", unit: "FTEs", label: "operations and shared services, Scotiabank Mexico" },
    { value: "USD 46MM", label: "in efficiencies from the Banco del Trabajo integrations" },
  ],

  // Newest first. `lane` groups roles into one row of the hero timeline.
  experience: [
    {
      lane: "Growfit Inc.",
      title: "Director",
      company: "Growfit Inc. · Self-employed",
      start: "Jan 2022", end: "Present",
      summary: "Advisory work with financial institutions, fintechs and service organizations.",
      bullets: [
        { head: "Operating Model Transformation (TOM)", text: "I lead end-to-end assessments and redesign of Target Operating Models, aligning operations with growth, scalability, and regulatory needs. I define transformation roadmaps, outsourcing strategies, and lead RFPs and negotiation of goods and services, ensuring value and efficiency." },
        { head: "Digital, AI & Process Modernization", text: "I implement AI, RPA, and workflow automation to reduce manual effort, accelerate cycle times, and improve decision-making. I drive process digitization across onboarding, servicing, and operations, enabling agile and scalable environments." },
        { head: "Productivity & Cost Optimization", text: "I deliver efficiency gains (up to ~80%) through simplification, standardization, and automation. I introduce KPIs and dashboards to improve visibility, accountability, and sustained performance." },
        { head: "Financial Discipline & Budgeting", text: "I support budget forecasting, cost management, and financial planning, ensuring initiatives are prioritized and aligned with business objectives and ROI." },
        { head: "Governance & Risk Management", text: "I establish PMOs, reporting, and governance frameworks to ensure disciplined execution and alignment. I embed risk and control structures into processes." },
        { head: "Customer Experience Improvement", text: "I redesign onboarding and servicing journeys, improving turnaround times, transparency, and CX." },
        { head: "Leadership & Culture", text: "I build and align cross-functional teams, support senior leadership, and foster a culture of accountability and continuous improvement, enabling sustainable transformation." },
      ],
      clients: ["Santander USA", "Nave Bank PR", "PJ Agribusiness"],
    },
    {
      lane: "Scotiabank Colombia",
      title: "Senior Vice President and Head of Business Modernization",
      company: "Scotiabank",
      start: "Apr 2018", end: "Sep 2021",
      location: "Bogotá, Colombia",
      summary: "Lead the Modernization at BNS Colombia, serving the different lines of business.",
      bullets: [
        { text: "Responsible for the USD 200MM Modernization of multiple Core Systems at BNS Colombia, serving the different lines of business (Banking Core, Digital Sales, Cash Management, Capital Markets, etc.)." },
        { text: "Lead with the Digital Factory the implementation of digital solutions covering all asset and liability products, from customer acquisition to day-to-day ops." },
        { text: "Responsible for the Process Transformation, implemented the Lean culture, with efficiencies up to 70%." },
      ],
    },
    {
      lane: "Scotiabank Colombia",
      title: "Senior Vice President and Head of Integration",
      company: "Scotiabank",
      start: "Apr 2018", end: "Mar 2020",
      location: "Bogotá, Colombia",
      summary: "Lead the Integration of the acquired Citibank Business into the Scotiabank Colpatria Colombia Subsidiary.",
      bullets: [
        { text: "Responsible for the Integration of the acquired Citibank Business (Retail, Small and Commercial Businesses) into Scotiabank Colombia Subsidiary." },
        { text: "Led +1500 FTEs grouped in more than 30 cross-functional teams covering all areas across the Bank." },
        { text: "Responsible of USD 130 million budget, successfully executed at 80%." },
        { text: "Achieved due diligence target efficiencies by 120%." },
      ],
    },
    {
      lane: "Scotiabank Mexico",
      title: "Senior Vice President, Head Operations & Shared Services",
      company: "Scotiabank Mexico",
      start: "Feb 2013", end: "Mar 2018",
      location: "Mexico",
      summary: "Led the operations and shared services of all business lines. Responsible for operations of the different Business Lines, Innovation, Collections, Fraud, Claims and Real Estate.",
      bullets: [
        { text: "Responsible for operations and shared services of all business lines, 2400 FTEs, USD 200MM operating budget." },
        { text: "Planned and executed the Core System conversion of Accounting and Customer Information File at 100% and led the foundation for the full migration of the operation." },
        { text: "Implemented a Trade Finance Shared Services Hub for 100% of the countries in International Banking; and a Credit Card Operations Hub supporting Mexico, Costa Rica & Panama." },
      ],
    },
    {
      lane: "Scotiabank Uruguay",
      title: "Assistant General Manager & CAO",
      company: "Scotiabank Uruguay",
      start: "Jan 2011", end: "Jan 2013",
      location: "Uruguay",
      summary: "CAO at Scotiabank Uruguay. Led the integration of Banco Comercial & Pronto! into Scotiabank. Member of the Scotiabank Board at Uruguay.",
      bullets: [
        { text: "Led the integration of Banco Comercial & Pronto! into Scotiabank, reaching 100% of the Y1 efficiencies." },
        { text: "Member of the Scotiabank Board at Uruguay; Led the Technology, Shared Services, Finance, and Legal Teams at Banco Comercial, improving productivity by 15%." },
      ],
    },
    {
      lane: "Scotiabank Peru",
      title: "Chief Executive Officer, Shared Services Company",
      company: "Scotiabank Peru",
      start: "Jan 2010", end: "Jun 2011",
      location: "Peru",
      summary: "CEO of the Shared Services Company that provides critical services to Scotiabank and CrediScotia at Peru.",
      bullets: [
        { text: "Led 1800 FTEs at the Shared Services Company, accountable for field and contact center collections, sales and service contact centre, 47 Branches across Peru performing bank operations, collections and sales of banking products." },
        { text: "Improved productivity by 20% and ROE over written-off portfolios." },
      ],
    },
    {
      lane: "Scotiabank Peru",
      title: "Vice President & Head of Integration",
      company: "Scotiabank Peru",
      start: "2008", end: "2010",
      location: "Peru",
      summary: "Led the Banco del Trabajo integration with Scotiabank in three countries (Peru, Guatemala, and Dominican Republic).",
      bullets: [
        { text: "Led the three integrations with Scotiabank, generating USD 46MM in efficiencies, USD 7.3MM below budget." },
        { text: "Peru: Reconverting a Bank into a Financial Company, system conversion with hub services, 2500 FTEs & USD 600MM in Assets." },
        { text: "Peru: Successfully merged the collection companies, reducing 50% of the FTEs, from 3000 to 1500." },
        { text: "Guatemala: Led the integration and systems conversion of Banco de Antigua, with Hub services from Peru, reaching 100% of the targets." },
        { text: "Dominican Republic: Led the Banco de Altas Cumbres integration." },
      ],
    },
    {
      lane: "Scotiabank Canada",
      title: "Director, M&A Integrations",
      company: "Scotiabank",
      start: "Jan 2005", end: "Aug 2008",
      location: "Canada",
      summary: "Responsible for integration of various Central and Latin America acquisitions.",
      bullets: [
        { text: "El Salvador: Banco de Comercio with Scotiabank integration." },
        { text: "Peru: Banco Wiese with Banco Sudamericano Integration merging portfolios and clients and launching Scotiabank as a new merged entity. Led various teams from Product to Operations and Technology." },
        { text: "Provide consulting services to several integrations: Costa Rica-Interfin with BNS / Chile-Banco del Desarrollo with BNS. Led the Credit Card conversion and integration of Citibank Dom. Republic with Scotiabank." },
      ],
    },
    {
      lane: "Scotiabank Canada",
      title: "Director, Credit Card Platform Conversions",
      company: "Scotiabank",
      start: "Feb 2003", end: "Dec 2004",
      location: "Canada",
      summary: "Planned and led several Card platform conversions across Central America and Caribbean countries (Bahamas, Jamaica, El Salvador, Dominican Republic and Puerto Rico). Led the Collections and Card Operation Teams.",
    },
    {
      lane: "Scotiabank Argentina",
      title: "Administration Manager",
      company: "Scotiabank Quilmes",
      start: "Sep 1995", end: "Jan 2003",
      location: "Buenos Aires Province, Argentina",
      summary: "Responsible for the budgeting planning of the different business lines and for the Branches support team.",
    },
  ],

  // The profile lists 12; these are the ones shown. The page links to the full list.
  education: [
    { school: "Universidad del CEMA", degree: "Postgraduate in Strategic Management of Artificial Intelligence and Automation", start: "Oct 2023", end: "Aug 2024" },
    { school: "Universidad Torcuato Di Tella", degree: "Consulting (course)", start: "Aug 2024", end: "Sep 2024" },
    { school: "The University of Western Ontario, Richard Ivey School of Business", degree: "Leadership (course)" },
  ],
  educationMore: "https://www.linkedin.com/in/fernando-uhart-08542943/details/education/",

  // The profile lists 55; these are the ones visible in the export.
  skills: ["Strategic business transformation", "IT-enabled business transformation", "Customer experience", "Culture change", "Communication", "Analytical skills"],
  skillsMore: "https://www.linkedin.com/in/fernando-uhart-08542943/details/skills/",

  languages: [{ name: "Spanish" }, { name: "English" }],

  // Optional public email. Leave empty to show LinkedIn as the only contact.
  email: "",
};
