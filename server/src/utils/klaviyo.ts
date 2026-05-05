const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY?.trim();
const KLAVIYO_MARKETING_LIST_ID = process.env.KLAVIYO_MARKETING_LIST_ID?.trim();
const KLAVIYO_REVISION = '2026-04-15';

interface MarketingProfile {
  email: string;
  name?: string;
  phone?: string;
}

export const subscribeProfileToKlaviyo = async (profile: MarketingProfile) => {
  if (!KLAVIYO_API_KEY || !KLAVIYO_MARKETING_LIST_ID) {
    return;
  }

  const [firstName, ...lastNameParts] = (profile.name || '').trim().split(/\s+/).filter(Boolean);

  const response = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      revision: KLAVIYO_REVISION,
    },
    body: JSON.stringify({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Terry Auto Service account signup',
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: profile.email,
                  ...(profile.phone ? { phone_number: profile.phone } : {}),
                  ...(firstName ? { first_name: firstName } : {}),
                  ...(lastNameParts.length > 0 ? { last_name: lastNameParts.join(' ') } : {}),
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: new Date().toISOString(),
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: KLAVIYO_MARKETING_LIST_ID,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Klaviyo subscribe failed: ${response.status} ${details}`);
  }
};
