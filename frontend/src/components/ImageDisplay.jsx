import React, { useState, useEffect } from 'react';

const ImageDisplay = ({ stock }) => {
  const [plotBase64, setPlotBase64] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlot = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://127.0.0.1:8000/predict?ticker=${stock}`);
        const data = await response.json();
        setPlotBase64(data.plot_base64);
      } catch (error) {
        console.error('Failed to fetch plot:', error);
      }
      setLoading(false);
    };

    if (stock) {
      fetchPlot();
    }
  }, [stock]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Stock Prediction for {stock}</h1>
      {loading ? (
        <p>Loading image...</p>
      ) : plotBase64 ? (
        <img
          src={`data:image/png;base64,${plotBase64}`}
          alt={`Prediction Plot for ${stock}`}
          className="rounded shadow max-w-full h-auto"
        />
      ) : (
        <p>No image available.</p>
      )}
    </div>
  );
};

export default ImageDisplay;
