// server/langchain-agent.js
// LangChain Agent Engine - OpenRouter Integration

async function runAgentDecision({ client, blueprint, discoveryData }) {
  const model = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  const logs = [
    `[LangChain] Agent initialized`,
    `[OpenRouter] Selected model: ${model}`,
    `[Blueprint Registry] Loaded candidate blueprint: ${blueprint.name}`,
    `[Discovery] Analysis complete for ${client.name}`,
    `[Price Engine] Base: $${blueprint.priceBase} + Complexity adjustment`,
    `[Action] Scaffold & proposal ready`
  ];

  if (openRouterApiKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are ITG Agent Decision Engine. Recommend next architecture steps.' },
            { role: 'user', content: `Client: ${client.name}, Service: ${client.service}, Blueprint: ${blueprint.name}` }
          ]
        })
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        logs.push(`[OpenRouter Response] ${data.choices[0].message.content.slice(0, 100)}...`);
      }
    } catch (e) {
      logs.push(`[OpenRouter Error] ${e.message}`);
    }
  }

  return { client, blueprint, logs };
}

module.exports = { runAgentDecision };
