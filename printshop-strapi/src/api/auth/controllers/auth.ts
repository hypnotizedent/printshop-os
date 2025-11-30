/**
 * Custom Auth Controller for PrintShop OS
 * Handles customer login/signup and employee PIN validation
 */

import { Context } from 'koa';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'printshop-os-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export default {
  /**
   * Customer Login
   * POST /auth/customer/login
   */
  async customerLogin(ctx: Context) {
    const { email, password } = ctx.request.body as { email?: string; password?: string };

    if (!email || !password) {
      return ctx.badRequest('Email and password are required');
    }

    try {
      // Find customer by email
      const customers = await strapi.documents('api::customer.customer').findMany({
        filters: { email: email.toLowerCase() },
        limit: 1,
      });

      const customer = customers[0];

      if (!customer) {
        return ctx.unauthorized('Invalid email or password');
      }

      // Check if customer has a password set
      if (!customer.passwordHash) {
        return ctx.badRequest('Account not set up for login. Please sign up first.');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, customer.passwordHash);

      if (!isValidPassword) {
        return ctx.unauthorized('Invalid email or password');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: customer.id,
          documentId: customer.documentId,
          email: customer.email,
          type: 'customer',
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Return customer data (without passwordHash)
      const { passwordHash, ...customerData } = customer;

      ctx.body = {
        success: true,
        token,
        user: customerData,
      };
    } catch (error) {
      strapi.log.error('Customer login error:', error);
      return ctx.internalServerError('Login failed');
    }
  },

  /**
   * Customer Signup
   * POST /auth/customer/signup
   */
  async customerSignup(ctx: Context) {
    const { email, password, name, phone, company } = ctx.request.body as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      company?: string;
    };

    if (!email || !password || !name) {
      return ctx.badRequest('Email, password, and name are required');
    }

    if (password.length < 8) {
      return ctx.badRequest('Password must be at least 8 characters');
    }

    try {
      // Check if email already exists
      const existing = await strapi.documents('api::customer.customer').findMany({
        filters: { email: email.toLowerCase() },
        limit: 1,
      });

      if (existing.length > 0) {
        // Check if they have a password already
        if (existing[0].passwordHash) {
          return ctx.badRequest('Email already registered. Please login instead.');
        }
        
        // Update existing customer with password
        const hashedPassword = await bcrypt.hash(password, 12);
        const updatedCustomer = await strapi.documents('api::customer.customer').update({
          documentId: existing[0].documentId,
          data: {
            passwordHash: hashedPassword,
            name: name || existing[0].name,
            phone: phone || existing[0].phone,
            company: company || existing[0].company,
          },
        });

        const token = jwt.sign(
          {
            id: updatedCustomer.id,
            documentId: updatedCustomer.documentId,
            email: updatedCustomer.email,
            type: 'customer',
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        const { passwordHash, ...customerData } = updatedCustomer;

        ctx.body = {
          success: true,
          token,
          user: customerData,
          message: 'Account activated successfully',
        };
        return;
      }

      // Create new customer
      const hashedPassword = await bcrypt.hash(password, 12);
      const newCustomer = await strapi.documents('api::customer.customer').create({
        data: {
          email: email.toLowerCase(),
          name,
          phone: phone || null,
          company: company || null,
          passwordHash: hashedPassword,
          notes: `Signed up on ${new Date().toISOString()}`,
        },
      });

      const token = jwt.sign(
        {
          id: newCustomer.id,
          documentId: newCustomer.documentId,
          email: newCustomer.email,
          type: 'customer',
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const { passwordHash, ...customerData } = newCustomer;

      ctx.status = 201;
      ctx.body = {
        success: true,
        token,
        user: customerData,
        message: 'Account created successfully',
      };
    } catch (error) {
      strapi.log.error('Customer signup error:', error);
      return ctx.internalServerError('Signup failed');
    }
  },

  /**
   * Employee PIN Validation
   * POST /auth/employee/validate-pin
   */
  async validateEmployeePIN(ctx: Context) {
    const { pin } = ctx.request.body as { pin?: string };

    if (!pin) {
      return ctx.badRequest('PIN is required');
    }

    if (pin.length < 4 || pin.length > 6) {
      return ctx.badRequest('PIN must be 4-6 digits');
    }

    try {
      // Find all active employees and check PIN
      const employees = await strapi.documents('api::employee.employee').findMany({
        filters: { isActive: true },
      });

      // Check each employee's PIN (stored hashed)
      for (const employee of employees) {
        if (!employee.pin) continue;
        
        const isValidPin = await bcrypt.compare(pin, employee.pin);
        if (isValidPin) {
          // Generate token for employee
          const token = jwt.sign(
            {
              id: employee.id,
              documentId: employee.documentId,
              email: employee.email,
              role: employee.role,
              department: employee.department,
              type: 'employee',
            },
            JWT_SECRET,
            { expiresIn: '12h' } // Shorter expiry for employees
          );

          const { pin: _pin, ...employeeData } = employee;

          ctx.body = {
            success: true,
            token,
            employee: employeeData,
          };
          return;
        }
      }

      return ctx.unauthorized('Invalid PIN');
    } catch (error) {
      strapi.log.error('Employee PIN validation error:', error);
      return ctx.internalServerError('PIN validation failed');
    }
  },

  /**
   * Verify Token
   * GET /auth/verify
   */
  async verifyToken(ctx: Context) {
    const authHeader = ctx.request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        documentId: string;
        email: string;
        type: 'customer' | 'employee';
        role?: string;
        department?: string;
      };

      if (decoded.type === 'customer') {
        const customer = await strapi.documents('api::customer.customer').findOne({
          documentId: decoded.documentId,
        });

        if (!customer) {
          return ctx.unauthorized('Customer not found');
        }

        const { passwordHash, ...customerData } = customer;
        ctx.body = {
          valid: true,
          type: 'customer',
          user: customerData,
        };
      } else if (decoded.type === 'employee') {
        const employee = await strapi.documents('api::employee.employee').findOne({
          documentId: decoded.documentId,
        });

        if (!employee || !employee.isActive) {
          return ctx.unauthorized('Employee not found or inactive');
        }

        const { pin, ...employeeData } = employee;
        ctx.body = {
          valid: true,
          type: 'employee',
          employee: employeeData,
        };
      } else {
        return ctx.unauthorized('Invalid token type');
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return ctx.unauthorized('Token expired');
      }
      return ctx.unauthorized('Invalid token');
    }
  },

  /**
   * Logout (client-side token removal, but we can log it)
   * POST /auth/logout
   */
  async logout(ctx: Context) {
    // In a stateless JWT system, logout is handled client-side
    // We can log the logout event if needed
    ctx.body = {
      success: true,
      message: 'Logged out successfully',
    };
  },

  /**
   * Get Customer Orders
   * GET /customer/orders
   */
  async getCustomerOrders(ctx: Context) {
    const authHeader = ctx.request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized('Authentication required');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        documentId: string;
        email: string;
        type: string;
      };

      if (decoded.type !== 'customer') {
        return ctx.unauthorized('Customer authentication required');
      }

      const page = parseInt(ctx.query.page as string) || 1;
      const limit = Math.min(parseInt(ctx.query.limit as string) || 10, 50);
      const start = (page - 1) * limit;

      // Find orders for this customer
      const orders = await strapi.documents('api::order.order').findMany({
        filters: {
          customer: { documentId: decoded.documentId },
        },
        populate: ['lineItems', 'customer'],
        sort: { createdAt: 'desc' },
        start,
        limit,
      });

      // Transform to match frontend expectations
      const transformedOrders = orders.map((order: any) => ({
        id: order.documentId,
        orderNumber: order.printavoId || order.orderNumber || `ORD-${order.id}`,
        status: order.status || 'PENDING',
        total: order.totalAmount || 0,
        createdAt: order.createdAt,
        items: order.lineItems || [],
      }));

      ctx.body = {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total: orders.length,
        },
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return ctx.unauthorized('Token expired');
      }
      strapi.log.error('Get customer orders error:', error);
      return ctx.internalServerError('Failed to fetch orders');
    }
  },

  /**
   * Get Single Customer Order
   * GET /customer/orders/:orderNumber
   */
  async getCustomerOrder(ctx: Context) {
    const authHeader = ctx.request.headers.authorization;
    const { orderNumber } = ctx.params;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized('Authentication required');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        documentId: string;
        email: string;
        type: string;
      };

      if (decoded.type !== 'customer') {
        return ctx.unauthorized('Customer authentication required');
      }

      // Find order by orderNumber or printavoId
      const orders = await strapi.documents('api::order.order').findMany({
        filters: {
          $or: [
            { printavoId: orderNumber },
            { orderNumber: orderNumber },
            { documentId: orderNumber },
          ],
        },
        populate: ['lineItems', 'customer'],
        limit: 1,
      });

      const order = orders[0];

      if (!order) {
        return ctx.notFound('Order not found');
      }

      // Verify this order belongs to the customer
      if (order.customer?.documentId !== decoded.documentId) {
        return ctx.forbidden('Access denied');
      }

      ctx.body = {
        order: {
          id: order.documentId,
          orderNumber: order.printavoId || order.orderNumber || `ORD-${order.id}`,
          status: order.status || 'PENDING',
          total: order.totalAmount || 0,
          createdAt: order.createdAt,
          items: order.lineItems || [],
          customer: {
            name: order.customer?.name,
            email: order.customer?.email,
          },
        },
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return ctx.unauthorized('Token expired');
      }
      strapi.log.error('Get customer order error:', error);
      return ctx.internalServerError('Failed to fetch order');
    }
  },

  /**
   * Get Customer Quotes
   * GET /customer/quotes
   */
  async getCustomerQuotes(ctx: Context) {
    const authHeader = ctx.request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized('Authentication required');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        documentId: string;
        email: string;
        type: string;
      };

      if (decoded.type !== 'customer') {
        return ctx.unauthorized('Customer authentication required');
      }

      const page = parseInt(ctx.query.page as string) || 1;
      const limit = Math.min(parseInt(ctx.query.limit as string) || 10, 50);
      const start = (page - 1) * limit;

      // Find quotes for this customer
      const quotes = await strapi.documents('api::quote.quote').findMany({
        filters: {
          customer: { documentId: decoded.documentId },
        },
        populate: ['customer'],
        sort: { createdAt: 'desc' },
        start,
        limit,
      });

      const transformedQuotes = quotes.map((quote: any) => ({
        id: quote.documentId,
        quoteNumber: quote.quoteNumber || `QT-${quote.id}`,
        status: quote.status || 'PENDING',
        total: quote.subtotal || 0,
        createdAt: quote.createdAt,
        expiresAt: quote.expiresAt,
        items: quote.lineItems || [],
      }));

      ctx.body = {
        quotes: transformedQuotes,
        pagination: {
          page,
          limit,
          total: quotes.length,
        },
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return ctx.unauthorized('Token expired');
      }
      strapi.log.error('Get customer quotes error:', error);
      return ctx.internalServerError('Failed to fetch quotes');
    }
  },

  /**
   * Change Customer Password
   * POST /auth/customer/change-password
   */
  async changePassword(ctx: Context) {
    const authHeader = ctx.request.headers.authorization;
    const { currentPassword, newPassword } = ctx.request.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized('Authentication required');
    }

    if (!currentPassword || !newPassword) {
      return ctx.badRequest('Current password and new password are required');
    }

    if (newPassword.length < 8) {
      return ctx.badRequest('New password must be at least 8 characters');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        documentId: string;
        email: string;
        type: string;
      };

      if (decoded.type !== 'customer') {
        return ctx.unauthorized('Customer authentication required');
      }

      // Find customer
      const customer = await strapi.documents('api::customer.customer').findOne({
        documentId: decoded.documentId,
      });

      if (!customer) {
        return ctx.notFound('Customer not found');
      }

      if (!customer.passwordHash) {
        return ctx.badRequest('Account does not have a password set');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, customer.passwordHash);

      if (!isValidPassword) {
        return ctx.badRequest('Current password is incorrect');
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await strapi.documents('api::customer.customer').update({
        documentId: decoded.documentId,
        data: {
          passwordHash: hashedPassword,
        },
      });

      // Log the activity (ignore type error - content type will be available at runtime)
      try {
        // @ts-expect-error - customer-activity content type registered at runtime
        await strapi.documents('api::customer-activity.customer-activity').create({
          data: {
            customer: decoded.documentId,
            activityType: 'password_changed',
            description: 'Password changed',
            ipAddress: ctx.request.ip || undefined,
          },
        });
      } catch (activityError) {
        // Don't fail if activity logging fails
        strapi.log.warn('Failed to log password change activity:', activityError);
      }

      ctx.body = {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return ctx.unauthorized('Token expired');
      }
      strapi.log.error('Change password error:', error);
      return ctx.internalServerError('Failed to change password');
    }
  },
};
