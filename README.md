# MABO Restaurant Management System (RMS) Backend

A comprehensive Restaurant Management System API built with Node.js, Express, and MySQL.

## Features

- **User Management**: Super Admin, Admin, Waiter, Customer roles
- **Order Management**: Complete order lifecycle management
- **Menu Management**: Categories, items, ingredients
- **Real-time Communication**: Socket.io integration
- **API Documentation**: Swagger/OpenAPI 3.0
- **Caching**: Redis integration
- **Authentication**: JWT-based authentication

## Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd rms
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file based on `constant/.env-railway.js`

4. **Generate Swagger documentation and start server**
```bash
npm run swagger:dev
```

5. **Access the application**
- API Server: http://localhost:9000
- Swagger Documentation: http://localhost:9000/api-docs

## Railway Platform Deployment

This application is configured for seamless deployment on Railway platform.

### Deployment Configuration

The project includes Railway-specific configurations:

- **`railway.json`**: Railway deployment settings
- **Environment Detection**: Automatic Railway environment detection
- **Dynamic Swagger**: Environment-aware API documentation
- **Production Scripts**: Optimized build and start commands

### Railway Environment Variables

Set these environment variables in your Railway project:

#### Database Configuration
```
DBHOST=your-mysql-host.railway.app
DBUSER=root
DBPASSWORD=your-database-password
DATABASE=restrotools
DBPORT=3306
```

#### Application Configuration
```
PORT=9000
NODE_ENV=PRODUCTION
JWT_SECRET_KEY=your-jwt-secret
```

#### Email Configuration
```
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Redis Configuration
```
REDIS_URL=redis://default:password@redis-service:6379
```

### Deployment Steps

1. **Connect your repository to Railway**
   - Go to [Railway.app](https://railway.app)
   - Create a new project from GitHub repo

2. **Configure services**
   - Add MySQL database service
   - Add Redis service (optional, for caching)
   - Configure environment variables

3. **Deploy**
   Railway will automatically:
   - Build the application
   - Generate Swagger documentation
   - Start the server
   - Provide a public URL

### Post-Deployment

After deployment, your API will be available at:
- **API**: `https://your-app.up.railway.app`
- **Swagger Docs**: `https://your-app.up.railway.app/api-docs`

The Swagger documentation will automatically include both local and production server URLs.

## API Documentation

### Swagger/OpenAPI

Access the interactive API documentation:
- **Local**: http://localhost:9000/api-docs
- **Production**: https://your-app.up.railway.app/api-docs

### Available Scripts

```bash
# Development
npm run dev              # Start with nodemon
npm run swagger:dev      # Generate swagger + start with nodemon

# Production
npm start               # Start server (Railway uses this)
npm run railway:start   # Generate swagger + start server
npm run build           # Generate swagger documentation only

# Utilities
npm run swagger:gen     # Generate swagger.json only
npm run redis:health    # Check Redis connection
npm run script          # Run setup scripts
```

### Environment-Aware Configuration

The application automatically detects the deployment environment:

- **Local Development**: Uses `127.0.0.1:9000`
- **Railway Production**: Uses Railway-provided URLs
- **Custom Production**: Uses `PRODUCTION_URL` environment variable

## Database Setup

### Railway MySQL

1. Add MySQL service to your Railway project
2. Note the connection details provided by Railway
3. Update environment variables accordingly

### Local MySQL

1. Install MySQL locally
2. Create database: `restrotools`
3. Update `.env` with local credentials

## Redis Setup (Optional)

### Railway Redis

1. Add Redis service to your Railway project
2. Use the provided `REDIS_URL`

### Local Redis

1. Install Redis locally
2. Start Redis server: `redis-server`
3. Use default connection: `redis://localhost:6379`

## File Upload Configuration

The application supports file uploads for:
- Business logos
- Item images
- Business images

Uploaded files are stored in the `uploads/` directory.

## Socket.io Configuration

Real-time features are enabled through Socket.io:
- Order status updates
- Live notifications
- Real-time communication

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## Monitoring and Logging

- Environment detection logging
- Redis health checks
- Database connection monitoring
- Error handling and logging

## Support

For support and questions:
- Check the API documentation at `/api-docs`
- Review environment logs for debugging
- Ensure all environment variables are properly set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: Replace `your-app` in URLs with your actual Railway service name, and update database credentials with your actual values.
