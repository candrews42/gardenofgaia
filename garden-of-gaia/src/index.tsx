import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Import these

// Create a theme instance
const theme = createTheme({
  // Your theme options go here
  // For example:
  palette: {
    primary: {
      main: '#556cd6',
    },
    // Add more customization here
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Wrap App inside ThemeProvider
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
