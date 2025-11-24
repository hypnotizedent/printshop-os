/**
 * support-ticket controller
 */

// @ts-nocheck
import { factories } from '@strapi/strapi';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/tickets');
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|ai|eps|psd|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Helper function to generate ticket number
async function generateTicketNumber(strapi: any) {
  const year = new Date().getFullYear();
  const count = await strapi.documents('api::support-ticket.support-ticket').count();
  const ticketNumber = `TKT-${year}-${String(count + 1).padStart(3, '0')}`;
  return ticketNumber;
}

export default factories.createCoreController(
  'api::support-ticket.support-ticket',
  ({ strapi }) => ({

    /**
     * Get customer tickets with filters
     */
    async findCustomerTickets(ctx) {
      try {
        const { customerId, status, category, search, page = 1, pageSize = 20 } = ctx.query;

        const filters: any = {};

        if (customerId) {
          filters.customer = { documentId: customerId };
        }

        if (status) {
          filters.status = status;
        }

        if (category) {
          filters.category = category;
        }

        if (search) {
          filters.$or = [
            { subject: { $containsi: search } },
            { description: { $containsi: search } },
            { ticketNumber: { $containsi: search } },
          ];
        }

        const tickets = await strapi.documents('api::support-ticket.support-ticket').findMany({
          filters,
          populate: ['customer', 'assignedTo', 'comments', 'attachments'],
          start: (page - 1) * pageSize,
          limit: pageSize,
          sort: { createdAt: 'desc' },
        });

        const total = await strapi.documents('api::support-ticket.support-ticket').count({
          filters,
        });

        ctx.body = {
          data: tickets,
          meta: {
            pagination: {
              page: Number(page),
              pageSize: Number(pageSize),
              pageCount: Math.ceil(total / pageSize),
              total,
            },
          },
        };
      } catch (err) {
        ctx.throw(500, err);
      }
    },

    /**
     * Create new ticket
     */
    async createTicket(ctx) {
      try {
        const {
          customerId,
          category,
          priority,
          subject,
          description,
          orderNumber,
        } = ctx.request.body;

        // Validate required fields
        if (!customerId || !category || !subject || !description) {
          return ctx.badRequest('Missing required fields');
        }

        // Generate ticket number
        const ticketNumber = await generateTicketNumber(strapi);

        // Create ticket
        const ticket = await strapi.documents('api::support-ticket.support-ticket').create({
          data: {
            ticketNumber,
            customer: customerId,
            category,
            priority: priority || 'Medium',
            status: 'Open',
            subject,
            description,
            orderNumber,
          },
          populate: ['customer'],
        });

        // Send email notification
        if (ticket.customer?.email) {
          await strapi.service('notification').sendTicketCreatedEmail(
            ticket.customer.email,
            ticketNumber,
            subject,
            strapi
          );
        }

        ctx.body = { data: ticket };
      } catch (err) {
        strapi.log.error('Error creating ticket:', err);
        ctx.throw(500, err);
      }
    },

    /**
     * Get single ticket for customer
     */
    async findOneCustomer(ctx) {
      try {
        const { id } = ctx.params;
        const { customerId } = ctx.query;

        const ticket = await strapi.documents('api::support-ticket.support-ticket').findOne({
          documentId: id,
          populate: {
            customer: true,
            assignedTo: true,
            comments: {
              populate: ['attachments'],
              sort: { createdAt: 'asc' },
            },
            attachments: true,
          },
        });

        if (!ticket) {
          return ctx.notFound('Ticket not found');
        }

        // Check if customer owns this ticket
        if (customerId && ticket.customer?.documentId !== customerId) {
          return ctx.forbidden('Access denied');
        }

        // Filter out internal notes for customers
        if (customerId && ticket.comments) {
          ticket.comments = ticket.comments.filter((comment: any) => !comment.isInternal);
        }

        ctx.body = { data: ticket };
      } catch (err) {
        ctx.throw(500, err);
      }
    },

    /**
     * Add comment to ticket
     */
    async addComment(ctx) {
      try {
        const { id } = ctx.params;
        const { userId, userType, message, isInternal } = ctx.request.body;

        if (!userId || !userType || !message) {
          return ctx.badRequest('Missing required fields');
        }

        // Get ticket
        const ticket = await strapi.documents('api::support-ticket.support-ticket').findOne({
          documentId: id,
          populate: ['customer'],
        });

        if (!ticket) {
          return ctx.notFound('Ticket not found');
        }

        // Create comment
        const comment = await strapi.documents('api::ticket-comment.ticket-comment').create({
          data: {
            ticket: id,
            userId,
            userType,
            message,
            isInternal: isInternal || false,
          },
        });

        // Update ticket status if it was resolved
        if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
          await strapi.documents('api::support-ticket.support-ticket').update({
            documentId: id,
            data: {
              status: 'In Progress',
            },
          });
        }

        // Send email notification to customer if staff replied
        if (userType === 'staff' && !isInternal && ticket.customer?.email) {
          await strapi.service('notification').sendTicketResponseEmail(
            ticket.customer.email,
            ticket.ticketNumber,
            ticket.subject,
            message,
            strapi
          );
        }

        ctx.body = { data: comment };
      } catch (err) {
        strapi.log.error('Error adding comment:', err);
        ctx.throw(500, err);
      }
    },

    /**
     * Update ticket status
     */
    async updateStatus(ctx) {
      try {
        const { id } = ctx.params;
        const { status } = ctx.request.body;

        if (!status) {
          return ctx.badRequest('Status is required');
        }

        const validStatuses = ['Open', 'In Progress', 'Waiting', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
          return ctx.badRequest('Invalid status');
        }

        const updateData: any = { status };

        // Set closedAt when ticket is closed
        if (status === 'Closed' || status === 'Resolved') {
          updateData.closedAt = new Date();
        }

        const ticket = await strapi.documents('api::support-ticket.support-ticket').update({
          documentId: id,
          data: updateData,
          populate: ['customer'],
        });

        // Send email notification
        if (ticket.customer?.email) {
          await strapi.service('notification').sendTicketStatusEmail(
            ticket.customer.email,
            ticket.ticketNumber,
            ticket.subject,
            status,
            strapi
          );
        }

        ctx.body = { data: ticket };
      } catch (err) {
        strapi.log.error('Error updating status:', err);
        ctx.throw(500, err);
      }
    },

    /**
     * Upload file attachment
     */
    async uploadFile(ctx) {
      try {
        return new Promise((resolve, reject) => {
          upload.array('files', 5)(ctx.request as any, ctx.response as any, async (err: any) => {
            if (err) {
              ctx.throw(400, err.message);
              return reject(err);
            }

            const { id } = ctx.params;
            const { commentId } = ctx.request.body;
            const files = (ctx.request as any).files;

            if (!files || files.length === 0) {
              ctx.throw(400, 'No files uploaded');
              return reject(new Error('No files'));
            }

            const attachments = [];

            for (const file of files) {
              const attachment = await strapi.documents('api::ticket-attachment.ticket-attachment').create({
                data: {
                  ticket: id,
                  comment: commentId || null,
                  fileName: file.originalname,
                  fileUrl: `/uploads/tickets/${file.filename}`,
                  fileSize: file.size,
                  mimeType: file.mimetype,
                },
              });
              attachments.push(attachment);
            }

            ctx.body = { data: attachments };
            resolve(attachments);
          });
        });
      } catch (err) {
        strapi.log.error('Error uploading file:', err);
        ctx.throw(500, err);
      }
    },

    /**
     * Download file attachment
     */
    async downloadFile(ctx) {
      try {
        const { id, fileId } = ctx.params;

        const attachment = await strapi.documents('api::ticket-attachment.ticket-attachment').findOne({
          documentId: fileId,
          populate: ['ticket'],
        });

        if (!attachment) {
          return ctx.notFound('File not found');
        }

        // Check if file belongs to the ticket
        if (attachment.ticket?.documentId !== id) {
          return ctx.forbidden('Access denied');
        }

        // Redirect to file URL or serve file
        ctx.redirect(attachment.fileUrl);
      } catch (err) {
        ctx.throw(500, err);
      }
    },
  })
);
