export async function fetchDiagram(prompt) {
  try {
    console.log('Sending request to backend...');
    const res = await fetch("http://localhost:3000/api/generate-diagram", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ prompt }),
    });

    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
      console.error('Error response:', errorData);
      throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log('Received data:', data);
    return data;
  } catch (error) {
    console.error("Error fetching diagram:", error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Could not connect to the backend server. Please make sure it is running on http://localhost:3000');
    }
    throw new Error(`Failed to generate diagram: ${error.message}`);
  }
}
