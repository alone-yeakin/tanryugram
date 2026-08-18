# TanRyuGram Apps Script mailer: safe setup

TanRyuGram can use the Apps Script relay for two separate transactional purposes: **signup/login verification codes** and **password-reset codes**. Creator Studio now exposes one owner-only switch for each purpose. The endpoint URL and shared secret are not stored in the public admin form; keep them in the project’s secure Secrets configuration so you can rotate the sender without changing application code.

## 1. Create the Apps Script project

Create a standalone Google Apps Script project under the Gmail account that will send TanRyuGram messages. Use a dedicated sender account rather than a personal mailbox. Keep the script owned by that account, enable two-step verification, add a recovery phone and recovery email, and do not share the script editor with users who do not need access.

Use this minimal relay pattern. Replace `RELAY_SECRET` in Script Properties with a long random value; do not put it in the source code or send it in a browser response.

```javascript
const RELAY_SECRET = PropertiesService.getScriptProperties().getProperty('RELAY_SECRET');
const SENDER_EMAIL = PropertiesService.getScriptProperties().getProperty('SENDER_EMAIL');
const SENDER_NAME = 'TanRyuGram';

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return json_({ ok: false });
    const body = JSON.parse(e.postData.contents);
    if (typeof body.secret !== 'string' || body.secret !== RELAY_SECRET) return json_({ ok: false });
    if (typeof body.to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) return json_({ ok: false });
    if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) return json_({ ok: false });
    if (typeof body.subject !== 'string' || body.subject.length > 120) return json_({ ok: false });
    if (typeof body.message !== 'string' || body.message.length > 2000) return json_({ ok: false });

    MailApp.sendEmail({
      to: body.to,
      subject: body.subject,
      body: body.message,
      name: SENDER_NAME,
      replyTo: SENDER_EMAIL
    });
    return json_({ ok: true });
  } catch (error) {
    console.error('mailer failure', error && error.message ? error.message : 'unknown');
    return json_({ ok: false });
  }
}
```

The server already sends the shared secret, recipient, six-digit code, subject, and plain-text message. The script must return JSON with `{ "ok": true }` only after `MailApp.sendEmail` succeeds. Never return the verification code in an error message or write the request body to logs.

## 2. Store Script Properties

In Apps Script, open **Project Settings → Script properties** and create `RELAY_SECRET` and `SENDER_EMAIL`. Generate a random secret of at least 32 characters. Do not use the Gmail password as the relay secret. Keep the sender address equal to the account that owns the script and is authorized to send mail.

## 3. Deploy the web app

Choose **Deploy → New deployment → Web app**. Execute the app as the script owner. For the web-app access setting, choose the least-public option that still permits the TanRyuGram server to call it; because the server cannot complete an interactive Google login, the deployment normally must accept anonymous HTTPS requests and rely on the long random shared secret for application authentication. Do not place this URL in the frontend, and do not expose the secret in a public repository.

Copy the `/exec` deployment URL into the secure project secret `MAIL_API_URL` and the same Script Property value into `MAIL_API_SECRET`. If you create a new deployment after changing code, update the secure URL rather than editing application source.

## 4. Turn on the two owner switches

In Creator Studio, turn on **Apps Script · login code** for signup verification and **Apps Script · reset code** for password recovery. Keep **Email delivery** enabled. Signup verification remains controlled separately by **Signup verification**. If Apps Script is unavailable, the application can use its configured automatic fallback when the purpose-specific switch is off.

The server applies no-CAPTCHA protection before sending: one request per address and purpose per minute, at most five per address and purpose per rolling hour, plus a project-wide hourly ceiling. Codes remain single-use and expire after 15 minutes. These controls reduce abuse but do not replace provider monitoring.

## 5. Rotate safely when Gmail changes

When the sender account changes, create or update the Apps Script deployment under the replacement account, set a new `RELAY_SECRET`, update `SENDER_EMAIL`, and then replace `MAIL_API_URL` and `MAIL_API_SECRET` in secure project Secrets. Test one signup code and one reset code, then remove or disable the old deployment. Do not change the endpoint from a normal public admin input, and do not paste the secret into chat.

## 6. Gmail safety checklist

Use this mailbox only for requested transactional messages. Avoid bulk marketing, unsolicited recipients, attachments, misleading subjects, repeated retries, or messages generated from untrusted user content. Monitor Apps Script executions and Gmail sending limits, stop sending to repeated bounces, and keep the account recovery information current. If Google displays a warning or quota error, disable the corresponding Creator Studio switch instead of repeatedly retrying.

The project deliberately does not reveal codes in the website, browser responses, or server error messages. It records only safe operational errors and never stores a user’s password.
