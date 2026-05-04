const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AdFlow Pro API',
      version: '1.0.0',
      description: 'Gig marketplace platform — service listings, bookings, escrow payments, moderation, and analytics.',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['client', 'provider', 'moderator', 'admin', 'super_admin'] },
            status: { type: 'string', enum: ['active', 'suspended', 'banned'] },
            avatar: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        Gig: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'submitted', 'under_review', 'approved', 'active', 'rejected', 'paused'] },
            ratingAvg: { type: 'number' },
            totalReviews: { type: 'number' },
            totalOrders: { type: 'number' },
            featured: { type: 'boolean' },
          },
        },
        GigPackage: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            type: { type: 'string', enum: ['basic', 'standard', 'premium'] },
            name: { type: 'string' },
            price: { type: 'number' },
            deliveryDays: { type: 'number' },
            revisions: { type: 'number' },
            features: { type: 'array', items: { type: 'string' } },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            status: {
              type: 'string',
              enum: ['placed', 'payment_pending', 'payment_verified', 'in_progress', 'delivered', 'revision_requested', 'completed', 'closed', 'cancelled', 'archived'],
            },
            requirements: { type: 'string' },
            deadline: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            amount: { type: 'number' },
            method: { type: 'string', enum: ['bank_transfer', 'easypaisa', 'jazzcash', 'card', 'other'] },
            transactionRef: { type: 'string' },
            senderName: { type: 'string' },
            screenshotUrl: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
          },
        },
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Dispute: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            reason: { type: 'string' },
            status: { type: 'string', enum: ['open', 'under_review', 'resolved', 'closed'] },
            resolutionNote: { type: 'string', nullable: true },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string', enum: ['order', 'payment', 'review', 'moderation', 'system', 'dispute'] },
            isRead: { type: 'boolean' },
            link: { type: 'string', nullable: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
