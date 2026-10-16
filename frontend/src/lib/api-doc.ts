import { createSwaggerSpec, type SwaggerOptions } from "next-swagger-doc"

const definition: SwaggerOptions["definition"] = {
  openapi: "3.0.0",
  info: {
    title: "Loukdo POS API",
    description:
      "REST API for the Loukdo Point of Sale system. Endpoints use NextAuth session cookies for authentication.",
    version: "1.0.0",
  },
  servers: [
    {
      url: process.env.AUTH_URL ?? "http://192.168.1.8:3000",
      description: "Loukdo API server",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      BranchStatus: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      },
      Branch: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          code: { type: "string" },
          url: { type: "string", nullable: true },
          adminName: { type: "string", nullable: true },
          adminEmail: { type: "string", nullable: true },
          status: { $ref: "#/components/schemas/BranchStatus" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateBranchInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          code: { type: "string" },
          url: { type: "string" },
          adminUsername: { type: "string" },
          adminPassword: { type: "string", minLength: 6 },
          status: { $ref: "#/components/schemas/BranchStatus" },
        },
        required: ["name", "adminUsername", "adminPassword"],
      },
      DuplicateBranchInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          adminUsername: { type: "string" },
          adminPassword: { type: "string", minLength: 6 },
        },
        required: ["name", "adminUsername", "adminPassword"],
      },
      Sale: {
        type: "object",
        properties: {
          id: { type: "string" },
          receiptNo: { type: "string", nullable: true },
          subtotal: { type: "number", format: "double" },
          tax: { type: "number", format: "double" },
          total: { type: "number", format: "double" },
          status: {
            type: "string",
            enum: ["COMPLETED", "REFUNDED", "VOID"],
          },
          branchId: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateSaleInput: {
        type: "object",
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                productId: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
              },
              required: ["productId", "quantity"],
            },
          },
          branchId: {
            type: "string",
            description: "SUPER_ADMIN only. Other roles always sell in their own branch.",
          },
        },
        required: ["items"],
      },
      ExchangeRate: {
        type: "object",
        properties: {
          id: { type: "number" },
          validDate: { type: "string" },
          currencyId: { type: "string" },
          currency: { type: "string" },
          symbol: { type: "string" },
          unit: { type: "number" },
          bid: { type: "number", format: "double" },
          ask: { type: "number", format: "double" },
          average: { type: "number", format: "double" },
        },
      },
    },
  },
}

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: "src/app/api",
    definition,
  })
}
