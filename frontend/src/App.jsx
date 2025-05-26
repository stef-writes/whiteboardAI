import React, { useState } from 'react';
import { fetchDiagram } from './api';
import DiagramViewer from './DiagramViewer';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('story');
  const [diagram, setDiagram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInputPanelOpen, setIsInputPanelOpen] = useState(true);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchDiagram(prompt, mode);
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
        padding: isInputPanelOpen ? '20px' : '10px 20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isInputPanelOpen ? '20px' : '0'
        }}>
          <h1 style={{ 
            color: '#2d3436',
            margin: '0',
            textAlign: 'center',
            fontSize: '24px',
            flex: 1
          }}>
            Ideation Space
          </h1>
          <button
            onClick={() => setIsInputPanelOpen(!isInputPanelOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '4px',
              color: '#2d3436',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
            title={isInputPanelOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {isInputPanelOpen ? '▲' : '▼'}
          </button>
        </div>

        {isInputPanelOpen && (
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
            
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <label style={{ fontSize: '16px', color: '#2d3436' }}>Mode:</label>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="mode"
                    value="story"
                    checked={mode === 'story'}
                    onChange={() => setMode('story')}
                    style={{ marginRight: '5px' }}
                  />
                  Story Mode
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="mode"
                    value="general"
                    checked={mode === 'general'}
                    onChange={() => setMode('general')}
                    style={{ marginRight: '5px' }}
                  />
                  General Mode
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="mode"
                    value="philosophy"
                    checked={mode === 'philosophy'}
                    onChange={() => setMode('philosophy')}
                    style={{ marginRight: '5px' }}
                  />
                  Philosophy Mode
                </label>
              </div>
            </div>
            
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
        )}
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
