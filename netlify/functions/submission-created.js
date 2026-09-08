// Runs automatically on EVERY Netlify Forms submission — no webhook setup needed.
// Netlify triggers any function named "submission-created" on this event.
// It forwards the submission to the Google Apps Script that writes the Inquiries tab.

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9YuhqBua-WY7XgTcPhtAezckRXIHuFoO3sLb8YbExnNxjsEnIKL9SnbLgS2bVCRQV/exec";

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const payload = body.payload || body;

    // Only forward the catering form (in case other forms are added later)
    if (payload.form_name && payload.form_name !== "catering-inquiry") {
      return { statusCode: 200, body: "ignored" };
    }

    // fetch follows the Apps Script 302 redirect automatically, so Google's
    // response quirk never reaches Netlify's failure counter
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: payload.id, data: payload.data || {} }),
      redirect: "follow",
    });

    const text = await res.text();
    console.log("Apps Script replied:", res.status, text.slice(0, 120));
    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("submission-created error:", err);
    // Still return 200 — the email notification already went out; never block the form.
    return { statusCode: 200, body: "error logged" };
  }
};
