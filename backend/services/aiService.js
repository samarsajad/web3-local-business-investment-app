const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function getRecommendation(businesses) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",   
    });

    const prompt = `
You are an AI helping users invest in local businesses.

Here is the data:
${JSON.stringify(businesses, null, 2)}

Recommend ONE business to invest in.
Explain WHY in 1-2 lines.
`;

    const result = await model.generateContent(prompt);

    return result.response.text();

  } catch (error) {
    console.error("AI SERVICE ERROR:", error);
    console.log("LOADED KEY:", process.env.GOOGLE_API_KEY);
    throw error;
  }
}

module.exports = { getRecommendation };