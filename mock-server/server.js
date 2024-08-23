const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Use CORS middleware to handle CORS issues
app.use(cors());
app.use(bodyParser.json());

// Load mappings from the configuration file
const loadMappings = () => {
  const data = fs.readFileSync('mappings.json');
  return JSON.parse(data).mappings;
};

// Function to get the response based on priority and request
const getResponse = (method, url) => {
  const mappings = loadMappings();
  const matchedMappings = mappings.filter(mapping => 
    mapping.request.method === method && new RegExp(mapping.request.urlPattern).test(url)
  );

  if (matchedMappings.length > 0) {
    // Sort by priority (ascending) and return the highest priority response
    matchedMappings.sort((a, b) => a.priority - b.priority);
    const responseConfig = matchedMappings[0].response;

    if (!responseConfig.bodyFileName) {
      return {
        headers: responseConfig.headers || {},
        status: responseConfig.status || 200,
        body: responseConfig
      };
    }

    const responseFilePath = path.join(__dirname, responseConfig.bodyFileName);

    if (fs.existsSync(responseFilePath)) {
      return {
        headers: responseConfig.headers || {},
        status: responseConfig.status || 200,
        body: JSON.parse(fs.readFileSync(responseFilePath))
      };
    } else {
      return { headers: {}, status: 500, body: { error: 'Response file not found' } };
    }
  }

  return { headers: {}, status: 404, body: { error: 'Endpoint not found' } };
};

// Handle requests
app.use((req, res) => {
  const { method, originalUrl } = req;
  const response = getResponse(method, originalUrl);

  // Set CORS headers and other response headers
  res.set(response.headers);
  res.status(response.status).json(response.body);
});

app.listen(port, () => {
  console.log(`Mock server running on http://localhost:${port}`);
});
