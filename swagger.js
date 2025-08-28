const path = require('path');
const swaggerAutogen = require('swagger-autogen')();
const outputFile = path.join(__dirname, 'swagger.json');  // Defines where the Swagger file will be generated
const endpointsFiles = ['./index.js','./routers/super.admin.js','./routers/admin.js','./routers/barista.js','./routers/user.js','./routers/waiter.js']; // Ensure the root file is specified

const doc = {
    info: {
      title: 'MABO APIs',
      description: 'Description'
    },
    host:'http://127.0.0.1:9000',
    schemes: [process.env.PROTOCOL || 'http'],
    swagger: "2.0", 
  };
  

  async function generateSwagger() {
    try {
        await swaggerAutogen(outputFile, endpointsFiles, doc);
        console.log("Swagger documentation has been generated at:", outputFile);
    } catch (error) {
        console.error('Error generating Swagger documentation:', error);
    }
  }

generateSwagger();