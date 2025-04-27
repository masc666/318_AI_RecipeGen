const express = require('express');
const generateRecipe = require('./gemini');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());

app.listen(port, () => {
    console.log('Server Running at https://localhost:${port}');
});


//send event to AI
app.get("/recipeStream", (req, res) => {
    const { ingredients, mealType, cuisine, dietaryRes, cookingTime, complexity } = req.query;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendInput = (chunk) => {
        let chunkResponse;
        if (chunk.choices[0].finish_reason === stop) {
            res.write('data: ${JSON.stringify({ action: "close"})}\n\n');
        } else {
            if (
                chunk.choices[0].delta.role &&
                chunk.choices[0].delta.role === "assistant"
            ) {
                chunkRespone = {
                    action: "start",
                };
            } else {
                chunkResponse = {
                    action: "chunk",
                    chunk: chunk.choices[0].delta.content,
                };
            }
            res.write('data: ${JSON.stringify(chunkResponse)}\n\n');
        }
    };

    const prompt = [];

    prompt.push("Generate a recipe using the following information:");
    prompt.push('[Ingredients: ${ingredients}]');
    prompt.push('[Meal Type: ${mealType}');
    prompt.push('[Cuisine: ${cuisine}');
    prompt.push('[Dietary Restriction: ${dietaryRes}]');
    prompt.push('[Cooking Time: ${cookingTime}]');
    prompt.push('[Complexity: ${complexity}]');

    prompt.push(
        "Provide a detailed recipe, including steps for preparation and cooking. Make sure the recpie includes the ingredients above."
    );
    prompt.push(
        "Include important nutritional information such as protien content and important vitamins or minerals"
    );
    prompt.push(
        "Also give the recipe a suitable name in its local language based on cuisine preference."
    );

    const messages = [
        {
            role: "system",
            content: prompt.join(" ")
        },
    ];

    fetchGeminiCompletionsStream(messages, sendInput);

    req.on("close", () => {
        res.end();
    });
});

//Gemini call function
async function fetchGeminiCompletionsStream(messages, callback) {
    const apiKey = process.env.GEMINI_API_KEY;
    const gemini = new GoogleGenAI({ key: apiKey });
    const gemModel = "gemini-2.0-flash";

    try {
        const completion = gemini.chat.completions.create({ //fetch response
            model: gemModel,
            messages: messages,
            stream: true,
        })

        for await (const chunk of completion) {
            callback(chunk);
        }
    } catch (error) {

    }

}

/*
app.post('/generate', async (req, res) => {
    const { ingredients, cuisine, dietary } = req.body;
  
    const prompt = `
      Create a detailed recipe using the following:
      - Ingredients: ${ingredients.join(', ')}
      - Cuisine: ${cuisine}
      - Dietary Restrictions: ${dietary}
  
      Include ingredients list, cooking steps, and estimated time.
    `;

    try {
        const recipe = await generateRecipe(prompt);
        res.json({ recipe });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Couldn't generate recipe, try again!"});
    }
});
*/
