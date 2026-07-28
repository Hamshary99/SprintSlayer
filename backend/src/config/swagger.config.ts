import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SprintSlayer API',
      version: '1.0.0',
      description: 'API documentation for SprintSlayer project and task management application',
    },
    servers: [
      {
        url: 'http://localhost:5000/api', 
        description: 'Development server'
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/modules/**/docs/*.yaml',
    './src/modules/**/*.route.ts', 
    './src/modules/**/*.controller.ts'
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
