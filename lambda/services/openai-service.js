export function chatCompletion(chatHistory, apiKey) {
    console.log("Calling Chat Completion API");
    const customHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
    }
    // Chat API Request
    let chatResponseText = "";
    const chatRequest = {
        "model": "gpt-3.5-turbo",
        "messages": chatHistory,
        "max_tokens": 100
    }
    return fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: customHeaders,
        body: JSON.stringify(chatRequest),
    }, { signal: AbortSignal.timeout(10000) });
}

export function generateImage(prompt, apiKey) {
    console.log("Calling Image Generation API");
    const customHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
    }
    const imageRequest = {
        "prompt": prompt,
        "n": 1,
        "size": "256x256"
    }
    return fetch("https://api.openai.com/v1/images/generations", {
        method: 'POST',
        headers: customHeaders,
        body: JSON.stringify(imageRequest),
    }, { signal: AbortSignal.timeout(10000) });
}