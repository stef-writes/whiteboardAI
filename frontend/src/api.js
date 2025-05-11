export async function fetchDiagram(prompt) {
  const res = await fetch("http://localhost:8000/api/generate-diagram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to generate diagram");
  }

  return await res.json();
}
