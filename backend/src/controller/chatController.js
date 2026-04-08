export const chat = async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Thiếu GROQ_API_KEY" });
    }
    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    const { message, history } = req.body || {};
    const msg = String(message || "").trim();
    if (!msg) return res.status(400).json({ message: "Thiếu message" });

    const messages = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-12)) {
        if (!h) continue;
        const role =
          h.role === "model" || h.role === "assistant" ? "assistant" : "user";
        const text = String(h.text || "").trim();
        if (!text) continue;
        messages.push({ role, content: text });
      }
    }
    messages.push({ role: "user", content: msg });

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 512,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({
        message: data?.error?.message || "Gọi Groq thất bại",
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";

    return res.status(200).json({ reply: text.trim() });
  } catch (error) {
    console.error("Lỗi chat:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

