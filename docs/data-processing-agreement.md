# Client Data Processing Agreement

**Template. Have it reviewed by counsel before use.**

This Data Processing Agreement ("Agreement") forms part of the services agreement between **[Agency legal name]** ("Agency", "we") and **[Client legal name]** ("Client", "you"), effective **[date]**. It describes how we handle Client information in Holdback HQ in accordance with the *Personal Information Protection and Electronic Documents Act* (PIPEDA).

## 1. Role of the parties

The Client controls its information. The Agency processes it only to provide the services: tracking invoice payment deadlines, holdback and WSIB clearances, and drafting reminders for the Client's approval.

## 2. Information we hold

| Category | Examples |
|---|---|
| Business contact information | Company name, trade, contact name, email, phone |
| Project information | General contractor and owner names, accounts-payable emails, site addresses, contract values and dates |
| Financial records | Invoices and their extracted fields, payment status, holdback amounts |
| Compliance records | WSIB clearance certificate numbers, issue and expiry dates |
| Correspondence | Draft and sent reminder emails |
| Audit records | A log of every change and every automated or AI action |

We do not need, and ask you not to send, banking details, SINs or card numbers. If present in a document, they are redacted before any AI processing.

## 3. Where information is processed

| Sub-processor | Purpose | Location |
|---|---|---|
| Supabase | Database, authentication, private file storage | Canada (ca-central-1, Montréal) |
| Groq | Invoice field extraction and email drafting (paid API tier) | United States |
| Google Cloud Vision | OCR of scanned documents, only when text cannot be read directly | United States |
| Resend | Delivery of emails the Agency has approved | United States |
| Vercel | Application hosting and scheduled jobs | United States / global |

Information processed outside Canada is subject to the laws of those jurisdictions. We will give 30 days' notice before adding a sub-processor.

## 4. Safeguards

- Row-level security isolates each client's records; client users can only see their own.
- Documents are stored in a private bucket and accessed only through signed links that expire after five minutes.
- AI processing uses paid API tiers whose terms exclude training on and retention of inputs. Only the text needed for extraction is sent.
- **No model training on Client data**, by the Agency or by its sub-processors.
- No email is sent on the Client's behalf without a person at the Agency reviewing and approving it.
- Access is limited to Agency staff who need it, using passwordless sign-in.

## 5. Retention

- Client records are kept for the term of the services agreement.
- Within 30 days of termination, all Client records and documents are deleted, unless a longer period is required by law.
- Activity logs are kept for the term plus 12 months, then deleted.
- Prospect data from a Cash Leak Scan is deleted automatically after 30 days unless the prospect becomes a client.

## 6. Access, correction and deletion on request

The Client may request access to, correction of, or deletion of its information at any time by emailing **[privacy contact email]**. We will respond within 30 days. Deletion removes the Client's records and stored documents from Holdback HQ; backups age out within the provider's backup window.

## 7. Breach notification

We will notify the Client without undue delay, and in any case within 72 hours, after determining that a breach of security safeguards involving the Client's information has occurred, and will cooperate with any reporting the Client must make to the Office of the Privacy Commissioner of Canada.

## 8. Not legal advice

Holdback HQ is an administrative service. Deadlines, reports and reminders are not legal advice.

---

**Agency:** ______________________ Name / title / date

**Client:** ______________________ Name / title / date
