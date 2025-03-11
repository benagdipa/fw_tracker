import { Trino, BasicAuth } from 'trino-client';  // Import necessary classes
import fs from 'fs';  // Import the file system module
import path from 'path';  // Import path module for cross-platform file path handling

// Disable SSL certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Function to read the configuration from a JSON file
function readConfig() {
  // Get the current working directory (which should be the root of your project)
  const rootDir = process.cwd();

  // Construct the path to the JSON config file (adjust path as needed)
 // const staticPath = "c:/xampp/htdocs/laravel/4g_tracker/storage/app/trino-config.json";  // Path starting from the root of your project

  const projectRoot = process.cwd();  // This will give us the Laravel project root
  // Resolve the absolute path to the 'trino-config.json' file, located in 'storage/app'
  const configFilePath = path.resolve(projectRoot, "../storage/app/trino-config.json");  // Absolute path to config file
  // Read the file synchronously (or asynchronously)
  const configFile = fs.readFileSync(configFilePath, 'utf-8');
  
  // Parse the JSON file content into an object
  const config = JSON.parse(configFile);

  return config;
}

// Read the configuration
const config = readConfig();

// Destructure the configuration into variables
const { host, port, schema, catalog, username, password } = config;
// Construct the server URL using HTTPS and port 443
const server = `https://${host}:443`;  // Server URL using HTTPS
// Create a Trino client with the configuration from the JSON file
const trino = Trino.create({
  server: server,  // The server URL from the JSON config
  catalog: catalog,  // The catalog name from the JSON config
  schema: schema,  // The schema name from the JSON config
  auth: new BasicAuth(username, password),  // Basic Authentication from the JSON config
});

// Get the query from the command-line argument
const query = process.argv[2];  // Query passed as argument

// Function to execute Trino query and return the results
async function executeQuery(query) {
  try {
    // Query Trino and get the results as an iterator
    const iter = await trino.query(query);
    let filteredResults = [];
    
    // Iterate over the result and filter out undefined or null values
    for await (const queryResult of iter) {
      if (Array.isArray(queryResult.data)) {
        const filteredData = queryResult.data.filter(item => item !== undefined && item !== null);
        filteredResults = [...filteredData];
      }
    }
    
    // Log the filtered result
    console.log(JSON.stringify({ filteredResults }));
  } catch (error) {
    console.error("Trino query error:", error);
    process.exit(1);  // Exit with an error code if the query fails
  }
}

// Call the function to execute the query
executeQuery(query);
