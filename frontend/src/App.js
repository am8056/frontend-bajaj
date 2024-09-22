import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [jsonInput, setJsonInput] = useState(''); // For JSON input (alphabets and numbers)
  const [dataArray, setDataArray] = useState([]); // State for storing processed data from JSON
  const [fileBase64, setFileBase64] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [fileType, setFileType] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]); // For Multi-select dropdown

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setError('No file selected');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB limit
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    setFileType(file.type || file.name.split('.').pop());

    // Convert file to base64 string
    reader.onload = () => {
      const base64String = reader.result.split(',')[1]; // Get the base64 part after the comma
      setFileBase64(base64String);
      setError('');
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    if (file.type.startsWith('image') || file.type === 'application/pdf') {
      setFilePreview(URL.createObjectURL(file)); // Preview for images or PDFs
    } else {
      setFilePreview(null);
    }

    reader.readAsDataURL(file); // Read as base64 string
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Step 1: Parse the JSON input
    try {
      const parsedJson = JSON.parse(jsonInput);

      // Step 2: Check if the parsed JSON has a "data" key and if it's an array
      if (!parsedJson.data || !Array.isArray(parsedJson.data)) {
        setError('Invalid format. JSON should contain a "data" key with an array of alphabets and numbers.');
        return;
      }

      // Step 3: Set the parsed array from "data" into dataArray
      setDataArray(parsedJson.data); // This will trigger the useEffect to make the API call
      setError(''); // Clear any previous errors
    } catch (err) {
      setError('Invalid JSON input.');
    }
  };

  // Step 4: Use useEffect to watch for changes in dataArray and call the API
  useEffect(() => {
    if (dataArray.length === 0) return; // Don't trigger API call if dataArray is empty

    // Prepare the payload for the API call
    const payload = {
      data: dataArray,
      file_b64: fileBase64,
    };

    // Call the API
    const callApi = async () => {
      try {
        const res = await axios.post('https://bajaj-backend-abhishek.vercel.app/bfhl', payload);
        setResponse(res.data);
        setError(''); // Clear any previous errors
      } catch (err) {
        console.error(err);
        setError('API error');
      }
    };

    callApi(); // Execute the API call when dataArray is set
  }, [dataArray]); // Dependency array - re-runs useEffect when dataArray changes

  const handleOptionChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedOptions([...selectedOptions, value]);
    } else {
      setSelectedOptions(selectedOptions.filter(option => option !== value));
    }
  };

  const renderResponse = () => {
    if (!response) return null;

    let filteredData = {};
    if (selectedOptions.includes('Alphabets')) {
      filteredData.alphabets = response.alphabets;
    }
    if (selectedOptions.includes('Numbers')) {
      filteredData.numbers = response.numbers;
    }
    if (selectedOptions.includes('Highest Lowercase Alphabet')) {
      filteredData.highest_lowercase_alphabet = response.highest_lowercase_alphabet;
    }

    return <pre>{JSON.stringify(filteredData, null, 2)}</pre>;
  };

  const renderFilePreview = () => {
    if (fileType.startsWith('image') && filePreview) {
      return <img src={filePreview} alt="Uploaded preview" style={{ maxWidth: '100%', height: 'auto' }} />;
    } else if (fileType === 'application/pdf' && filePreview) {
      return (
        <div>
          <a href={filePreview} target="_blank" rel="noopener noreferrer">
            View PDF
          </a>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h1>Input Form</h1>
      <form onSubmit={handleSubmit}>
        <label>
          JSON Input (with "data" key):
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Enter JSON like { "data": ["A", "1", "B", "2"] }'
            rows={5}
            cols={50}
          />
        </label>
        <br />
        <label>
          Upload File:
          <input type="file" onChange={handleFileUpload} accept="*" />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>File Preview:</h2>
      {renderFilePreview()}

      {/* Show Multi-Select Dropdown if response is available */}
      {response && (
        <div>
          <h2>Select Data to Display:</h2>
          <label>
            <input
              type="checkbox"
              value="Alphabets"
              onChange={handleOptionChange}
            />
            Alphabets
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              value="Numbers"
              onChange={handleOptionChange}
            />
            Numbers
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              value="Highest Lowercase Alphabet"
              onChange={handleOptionChange}
            />
            Highest Lowercase Alphabet
          </label>

          <h2>Filtered Response</h2>
          {renderResponse()}
        </div>
      )}
    </div>
  );
}

export default App;