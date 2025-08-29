console.log('Testing backend import...');

try {
  const app = require('./backend/app.js');
  console.log('Backend imported successfully');
} catch (error) {
  console.error('Error importing backend:', error);
}
