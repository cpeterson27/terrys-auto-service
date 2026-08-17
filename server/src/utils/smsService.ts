export const sendSms = async (to: string, body: string): Promise<void> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    console.warn('⚠️  Twilio SMS credentials not configured. Text message not sent.');
    return;
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Twilio SMS error (${response.status}): ${details}`);
  }

  console.log(`✓ Text notification sent to ${to}`);
};
