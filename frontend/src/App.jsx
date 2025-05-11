import React, { useState } from 'react';
import { fetchDiagram } from './api';
import DiagramViewer from './DiagramViewer';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [diagram, setDiagram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchDiagram(prompt);
      setDiagram(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Floating prompt box */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '600px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)'
      }}>
        <h1 style={{ 
          color: '#2d3436',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '24px'
        }}>
          Whiteboard AI
        </h1>

        <div style={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'column'
        }}>
          <textarea
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #dfe6e9',
              fontSize: '16px',
              resize: 'none',
              background: 'rgba(255, 255, 255, 0.9)'
            }}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to visualize... (e.g., 'Create a mind map about project management' or 'Show me a flowchart of the user registration process')"
          />
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#b2bec3' : '#4ecdc4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Generating...' : 'Generate Diagram'}
          </button>

          {error && (
            <div style={{
              padding: '12px',
              background: '#ff7675',
              color: 'white',
              borderRadius: '8px',
              marginTop: '10px'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Full-page diagram container */}
      <div style={{
        width: '100%',
        height: '100%',
        background: '#f8f9fa'
      }}>
        {diagram ? (
          <DiagramViewer diagram={diagram} />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#a0a0a0',
            fontSize: '18px'
          }}>
            Enter a prompt above to generate a diagram
          </div>
        )}
      </div>
    </div>
  );
}
