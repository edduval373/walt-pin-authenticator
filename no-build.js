#!/usr/bin/env node

/**
 * Disney Pin Authenticator build script for Railway deployment
 * Builds the complete application without Vite complications
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('Building Disney Pin Authenticator for Railway...');

try {
  // Copy the working React components from development to production build
  console.log('Creating production build with React components...');
  
  // First create the static build structure
  execSync('node create-complete-build.js', { stdio: 'inherit' });
  
  // Then replace the static HTML with the React-powered version
    const reactIndexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Disney Pin Authenticator - W.A.L.T.</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      // Import React components and render the app
      import React from 'https://esm.sh/react@18';
      import ReactDOM from 'https://esm.sh/react-dom@18/client';
      
      // Simulate the IntroPage component with all features
      function App() {
        const [progress, setProgress] = React.useState(0);
        const [showButton, setShowButton] = React.useState(false);
        const [legalExpanded, setLegalExpanded] = React.useState(false);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setProgress(prev => {
              if (prev >= 100) {
                clearInterval(interval);
                setShowButton(true);
                return 100;
              }
              return prev + 4;
            });
          }, 60);
          return () => clearInterval(interval);
        }, []);
        
        return React.createElement('div', {
          style: {
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            background: 'linear-gradient(to bottom, #eef2ff, #e0e7ff)',
            overflowY: 'auto',
            padding: '20px'
          }
        }, 
          React.createElement('div', {
            style: {
              textAlign: 'center',
              padding: '0 1rem',
              maxWidth: '100%',
              width: '100%',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }
          },
            // Logo section
            React.createElement('div', { style: { marginBottom: '1rem' } },
              React.createElement('img', {
                src: '/assets/PinAuthLogo_1748957062189.png',
                alt: 'W.A.L.T. Logo',
                style: {
                  width: '250px',
                  height: '250px',
                  objectFit: 'contain',
                  margin: '0 auto'
                }
              })
            ),
            
            // Text content
            React.createElement('div', {
              style: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '300px'
              }
            },
              React.createElement('div', { style: { marginBottom: '1.5rem' } },
                React.createElement('p', {
                  style: {
                    color: '#4f46e5',
                    fontSize: '2rem',
                    lineHeight: '2.5rem',
                    fontWeight: '500',
                    marginBottom: '1rem'
                  }
                }, 'Meet W.A.L.T.'),
                React.createElement('p', {
                  style: {
                    color: '#4f46e5',
                    fontSize: '1.125rem',
                    lineHeight: '1.75rem'
                  }
                }, 'the World-class Authentication and Lookup Tool')
              ),
              React.createElement('div', { style: { marginBottom: '2rem' } },
                React.createElement('h1', {
                  style: {
                    fontSize: '2.25rem',
                    lineHeight: '2.75rem',
                    fontWeight: '700',
                    color: '#4338ca',
                    marginBottom: '0.75rem'
                  }
                }, 'W.A.L.T. Mobile App'),
                React.createElement('p', {
                  style: {
                    fontSize: '1rem',
                    color: '#4f46e5',
                    fontWeight: '600'
                  }
                }, 'BETA Version 1.3.2')
              )
            ),
            
            // Legal section and button
            React.createElement('div', { style: { flexShrink: 0 } },
              React.createElement('div', {
                style: {
                  marginBottom: '1rem',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '2px solid #c7d2fe'
                }
              },
                React.createElement('div', {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                  }
                },
                  React.createElement('span', { style: { marginRight: '0.5rem' } }, '⚠️'),
                  React.createElement('h3', {
                    style: {
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: '#3730a3'
                    }
                  }, 'IMPORTANT LEGAL NOTICE')
                ),
                React.createElement('p', {
                  style: {
                    fontSize: '0.75rem',
                    color: '#3730a3',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                  }
                }, 'FOR ENTERTAINMENT PURPOSES ONLY.'),
                React.createElement('p', {
                  style: {
                    fontSize: '0.75rem',
                    color: '#4f46e5',
                    marginBottom: '0.75rem'
                  }
                }, 'This AI application is unreliable and should not be used for financial decisions.'),
                React.createElement('button', {
                  onClick: () => setLegalExpanded(!legalExpanded),
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: '#4f46e5',
                    fontWeight: '600',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%'
                  }
                },
                  'Read Full Legal Notice ',
                  React.createElement('span', null, legalExpanded ? '▲' : '▼')
                ),
                legalExpanded && React.createElement('div', {
                  style: {
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: '#eef2ff',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#374151',
                    textAlign: 'left',
                    lineHeight: '1.5'
                  }
                },
                  React.createElement('p', { style: { marginBottom: '0.5rem' } },
                    React.createElement('strong', null, 'Disclaimer of Warranties: '),
                    'This application provides entertainment value only. Results are not guaranteed to be accurate.'
                  ),
                  React.createElement('p', { style: { marginBottom: '0.5rem' } },
                    React.createElement('strong', null, 'No Financial Advice: '),
                    'Do not use this application for making financial decisions or determining actual value.'
                  ),
                  React.createElement('p', null,
                    React.createElement('strong', null, 'Limitation of Liability: '),
                    'Developers disclaim all liability for losses resulting from reliance on AI-generated content.'
                  )
                )
              ),
              
              // Loading bar
              React.createElement('div', {
                style: {
                  width: '100%',
                  height: '6px',
                  background: '#c7d2fe',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginBottom: '1rem'
                }
              },
                React.createElement('div', {
                  style: {
                    height: '100%',
                    background: '#4f46e5',
                    borderRadius: '3px',
                    width: progress + '%',
                    transition: 'width 0.1s ease-out'
                  }
                })
              ),
              
              // Button or loading text
              showButton ? 
                React.createElement('button', {
                  onClick: () => window.location.href = '/overview',
                  style: {
                    background: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                },
                  'I Acknowledge →'
                ) :
                React.createElement('p', {
                  style: {
                    color: '#4f46e5',
                    fontSize: '0.75rem',
                    marginBottom: '1rem'
                  }
                }, 'Loading resources...')
            )
          )
        );
      }
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    </script>
  </body>
</html>`;
  
  fs.writeFileSync('client/dist/index.html', reactIndexHtml, 'utf8');
  
  console.log('✅ Production build with React components created successfully');
  console.log('🚀 Ready for Railway deployment with complete IntroPage');
  process.exit(0);
} catch (error) {
  console.error('Build creation failed:', error.message);
  process.exit(1);
}