import Anthropic from "@anthropic-ai/sdk";

let client;

// Creamos el cliente solo cuando se necesita (ver nota más abajo)
function getClient() {
  client ??= new Anthropic(); // lee ANTHROPIC_API_KEY del entorno
  return client;
}

const PROMPT = `This is a photo of a Magic: The Gathering card.
Read the card name printed in the title bar at the top of the card.
If the card is printed in another language, give its English name.
Reply with ONLY a JSON object and no other text, in this exact format:
{"name": "<card name>", "confidence": "high" | "medium" | "low"}
If the image does not show a Magic: The Gathering card, reply:
{"name": null, "confidence": "low"}`;

export async function identifyCardName(buffer, mimeType) {
  let text;

  try {
    const message = await getClient().messages.create({
      model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            // La imagen va antes que el texto
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: buffer.toString("base64"),
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    text = message.content.find((block) => block.type === "text")?.text ?? "";
  } catch (error) {
    const wrapped = new Error(`Error al consultar la API de Claude: ${error.message}`);
    wrapped.status = 502;
    throw wrapped;
  }

  // Extraemos el JSON de la respuesta, por si Claude añade texto alrededor
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    const error = new Error("No se pudo interpretar la respuesta de Claude");
    error.status = 502;
    throw error;
  }

  try {
    const { name, confidence } = JSON.parse(match[0]);
    return { name: name ?? null, confidence: confidence ?? "low" };
  } catch {
    const error = new Error("La respuesta de Claude no tenía un formato válido");
    error.status = 502;
    throw error;
  }
}