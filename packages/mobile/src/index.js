import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [email, setEmail] = useState('');
  const [landingFeaturedMovies, setLandingFeaturedMovies] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLandingFeaturedMovies();
  }, []);

  const fetchLandingFeaturedMovies = async () => {
    try {
      setError(null);
      const response = await fetch('https://api.manahuduma.com/api/public/featured', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('LandingScreen - Featured movies API response:', data);

      if (data.success && data.data) {
        setLandingFeaturedMovies(data.data.slice(0, 6));
      } else {
        setError('No featured movies available');
      }
    } catch (error) {
      console.error('Error fetching featured movies for landing screen:', error);
      setError('Failed to load featured movies. Please try again.');
    }
  };

  const handleGetStarted = () => {
    console.log('Get Started clicked with email:', email);
    alert('Get Started clicked! Email: ' + email);
  };

  return (
    <div style={{
      backgroundImage: 'url(/assets/images/background_mob.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)'
      }} />
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        minHeight: '100vh'
      }}>
        {/* Logo */}
        <img 
          src="/assets/images/CADF_lg.png"
          alt="CADF Logo"
          style={{
            width: '200px',
            height: '60px',
            marginTop: '40px',
            marginBottom: '60px'
          }}
        />
        
        {/* Title */}
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          marginBottom: '10px',
          margin: 0
        }}>
          Lisha Kondoo Zangu
        </h1>
        
        {/* Subtitle */}
        <p style={{
          fontSize: '20px',
          color: '#fff',
          textAlign: 'center',
          marginBottom: '30px',
          paddingHorizontal: '10px',
          margin: '0 0 30px 0'
        }}>
          Mafundisho ya neno La Mungu kupitia Semina na Makongamano kuanzia 1990-2025
        </p>
        
        {/* Email Input */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            height: '50px',
            backgroundColor: '#fff',
            borderRadius: '5px',
            paddingHorizontal: '15px',
            color: '#000',
            marginBottom: '15px',
            border: 'none',
            fontSize: '16px'
          }}
        />
        
        {/* Button */}
        <button
          onClick={handleGetStarted}
          style={{
            backgroundColor: '#6A0DAD',
            paddingVertical: '15px',
            paddingHorizontal: '30px',
            borderRadius: '5px',
            marginBottom: '0',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <span style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            Jiunge Sasa
          </span>
        </button>
        
        {/* Error Message */}
        {error && (
          <p style={{
            color: '#ff6b6b',
            fontSize: '14px',
            textAlign: 'center',
            marginTop: '10px',
            marginBottom: '10px'
          }}>
            {error}
          </p>
        )}
        
        {/* Featured Thumbnails */}
        <div style={{
          width: '100%',
          marginTop: '30px',
          marginBottom: '30px'
        }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '15px',
            padding: '10px 0'
          }}>
            {landingFeaturedMovies.map((movie) => (
              <div key={movie._id} style={{
                minWidth: '200px',
                backgroundColor: '#1a1a1a',
                borderRadius: '10px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  color: '#fff',
                  margin: '0 0 10px 0'
                }}>
                  {movie.title || 'Content'}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#ccc',
                  margin: '0'
                }}>
                  {movie.description || 'Mafundisho ya neno La Mungu'}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Copyright */}
        <p style={{
          color: '#aaa',
          fontSize: '13px',
          marginTop: 'auto',
          textAlign: 'center',
          paddingBottom: '20px'
        }}>
          © Christopher & Diana Mwakasege Foundation (CADF)
        </p>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 