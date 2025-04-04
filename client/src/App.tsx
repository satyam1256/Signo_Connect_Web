import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>SIGNO Connect</h1>
      <p>The application is working!</p>
      <div>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            margin: '10px'
          }}
        >
          Count: {count}
        </button>
      </div>
      <div>
        <p>Frappe API is running</p>
        <a 
          href="/api/frappe-drivers" 
          target="_blank"
          style={{
            color: '#0066cc',
            textDecoration: 'underline'
          }}
        >
          View Drivers API
        </a>
      </div>
    </div>
  );
}

export default App;
