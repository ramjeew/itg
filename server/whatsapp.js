
// server/whatsapp.js - WhatsApp Cloud API (Meta free tier)
// Setup: https://developers.facebook.com/apps -> WhatsApp -> Get token + phone ID
// Webhook: GET /api/whatsapp/webhook for verification, POST for messages
const express = require('express');

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'itg_factory_verify_123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

function whatsappRouter(db) {
  const router = express.Router();

  // Verification for Meta
  router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WhatsApp] Webhook verified');
      return res.status(200).send(challenge);
    }
    res.sendStatus(403);
  });

  // Incoming messages
  router.post('/webhook', async (req, res) => {
    try {
      const entry = req.body.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      if (!message) return res.sendStatus(200);

      const from = message.from;
      const text = message.text?.body || '';
      const lower = text.toLowerCase();

      console.log(`[WhatsApp] ${from}: ${text}`);

      // Auto-create client if keyword BUILD
      if (lower.includes('build') || lower.includes('start') || lower.includes('hello')) {
        const client = {
          id: Date.now().toString(),
          name: change.value.contacts?.[0]?.profile?.name || `WhatsApp ${from.slice(-4)}`,
          email: `wa_${from}@whatsapp.local`,
          company: 'WhatsApp Lead',
          service: lower.includes('saas') ? 'Custom SaaS App' : lower.includes('bot') ? 'WhatsApp Bot' : 'AI System Build',
          source: 'whatsapp',
          discoveryData: { rawMessage: text, phone: from },
          status: 'new',
          paymentStatus: 'unpaid',
          createdAt: new Date().toISOString(),
          whiteLabel: { logo: '', color: '#ccff00', company: 'ITG' }
        };
        db.clients.push(client);

        // Auto-reply
        await sendWhatsApp(from,
`Thanks for typing BUILD 🚀

You're getting your private app factory portal.

I created your client profile. Next:
1. Fill this 60s form to spec your app: https://tally.so/r/YOUR_TALLY_ID
2. I'll scaffold your GitHub repo + live URL instantly
3. Pay with Paystack in your portal

Your portal will be at: https://your-app.onrender.com/portal?id=${client.id}

We ship in 7 days. - ITG Factory`);
      } else {
        // For other messages, log as discovery
        const client = db.clients.find(c => c.email === `wa_${from}@whatsapp.local`);
        if (client) {
          client.discoveryData.followUp = text;
        }
        await sendWhatsApp(from, `Got it: "${text}" - I've added this to your project spec. Want me to scaffold a demo? Reply YES`);
      }

      res.sendStatus(200);
    } catch (e) {
      console.error('[WhatsApp] Error', e);
      res.sendStatus(200);
    }
  });

  return router;
}

async function sendWhatsApp(to, text) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
    console.log(`[WhatsApp MOCK] To ${to}: ${text.slice(0,100)}`);
    return { mock: true };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      })
    });
    const data = await res.json();
    console.log('[WhatsApp] Sent', data);
    return data;
  } catch (e) {
    console.error('[WhatsApp] Send failed', e);
  }
}

module.exports = { whatsappRouter, sendWhatsApp };
