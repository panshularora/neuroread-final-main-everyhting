const API_BASE = "http://127.0.0.1:8000";

export const simplifyText = async (text) => {
  const response = await fetch(`${API_BASE}/simplify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
};