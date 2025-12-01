/**
 * Workflow Service
 * Handles order workflow transitions: Quote -> Order -> Job
 */

interface Strapi {
  log: {
    info: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
  };
  documents: (type: string) => {
    findOne?: (params: { documentId: string; populate?: string[] }) => Promise<unknown>;
    create?: (params: { data: Record<string, unknown> }) => Promise<unknown>;
    update?: (params: { documentId: string; data: Record<string, unknown> }) => Promise<unknown>;
  };
}

interface Quote {
  id: number;
  documentId: string;
  quoteNumber: string;
  status: string;
  items?: Array<{ description: string; quantity: number; price?: number }>;
  totalAmount?: number;
  notes?: string;
  customer?: {
    documentId: string;
    name: string;
    email: string;
  };
  approved_at?: string;
  order_id?: Order;
}

interface Order {
  id: number;
  documentId: string;
  orderNumber: string;
  status: string;
  items?: Array<{ description: string; quantity: number; price?: number }>;
  totalAmount?: number;
  customer?: string;
  created_at_timestamp?: string;
  job?: Job;
}

interface Job {
  id: number;
  documentId: string;
  jobNumber: string;
  status: string;
  title?: string;
  dueDate?: string;
  created_at_timestamp?: string;
}

interface WorkflowResult {
  order?: Order;
  job?: Job;
}

interface WorkflowStatus {
  quote: {
    number: string;
    status: string;
  };
  order: {
    number: string;
    status: string;
  } | null;
  job: {
    number: string;
    status: string;
  } | null;
}

/**
 * Generate order number with format ORD-YYMM-XXXX
 */
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}-${random}`;
}

/**
 * Generate job number with format JOB-YYMM-XXXX
 */
function generateJobNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `JOB-${year}${month}-${random}`;
}

/**
 * Create an order from an approved quote
 */
export async function createOrderFromQuote(strapi: Strapi, quote: Quote): Promise<Order> {
  const orderNumber = generateOrderNumber();
  
  const orderData = {
    orderNumber,
    status: 'Pending',
    items: quote.items || [],
    totalAmount: quote.totalAmount || 0,
    notes: quote.notes,
    customer: quote.customer?.documentId,
    quote: quote.documentId,
  };

  const documents = strapi.documents('api::order.order');
  if (!documents.create) {
    throw new Error('Create method not available');
  }
  
  const order = await documents.create({ data: orderData }) as Order;
  
  strapi.log.info(`Created order ${orderNumber} from quote ${quote.quoteNumber}`);
  
  return order;
}

/**
 * Create a job from an order
 */
export async function createJobFromOrder(strapi: Strapi, order: Order, quote: Quote): Promise<Job> {
  const jobNumber = generateJobNumber();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  
  const jobData = {
    jobNumber,
    status: 'PendingArtwork',
    title: `Job for Order ${order.orderNumber}`,
    order: order.documentId,
    quote: quote.documentId,
    customer: order.customer,
    dueDate: dueDate.toISOString().split('T')[0],
  };

  const documents = strapi.documents('api::job.job');
  if (!documents.create) {
    throw new Error('Create method not available');
  }
  
  const job = await documents.create({ data: jobData }) as Job;
  
  strapi.log.info(`Created job ${jobNumber} for order ${order.orderNumber}`);
  
  return job;
}

/**
 * Process quote approval workflow
 * Creates order and job from approved quote
 */
export async function processQuoteApproval(strapi: Strapi, quoteId: number): Promise<WorkflowResult> {
  const quoteDocuments = strapi.documents('api::quote.quote');
  
  if (!quoteDocuments.findOne) {
    throw new Error('FindOne method not available');
  }
  
  const quote = await quoteDocuments.findOne({
    documentId: quoteId.toString(),
    populate: ['customer', 'items'],
  }) as Quote | null;

  if (!quote) {
    throw new Error(`Quote ${quoteId} not found`);
  }

  if (quote.status === 'OrderCreated') {
    throw new Error(`Quote ${quoteId} already has an order created`);
  }

  // Create order from quote
  const order = await createOrderFromQuote(strapi, quote);

  // Create job from order
  const job = await createJobFromOrder(strapi, order, quote);

  // Update quote status
  if (quoteDocuments.update) {
    await quoteDocuments.update({
      documentId: quote.documentId,
      data: { status: 'OrderCreated' },
    });
  }

  return { order, job };
}

/**
 * Get workflow status for a quote
 */
export async function getWorkflowStatus(strapi: Strapi, quoteId: number): Promise<WorkflowStatus> {
  const quoteDocuments = strapi.documents('api::quote.quote');
  
  if (!quoteDocuments.findOne) {
    throw new Error('FindOne method not available');
  }
  
  const quote = await quoteDocuments.findOne({
    documentId: quoteId.toString(),
    populate: ['order_id', 'order_id.job'],
  }) as Quote | null;

  if (!quote) {
    throw new Error(`Quote ${quoteId} not found`);
  }

  const status: WorkflowStatus = {
    quote: {
      number: quote.quoteNumber,
      status: quote.status,
    },
    order: null,
    job: null,
  };

  if (quote.order_id) {
    status.order = {
      number: quote.order_id.orderNumber,
      status: quote.order_id.status,
    };

    if (quote.order_id.job) {
      status.job = {
        number: quote.order_id.job.jobNumber,
        status: quote.order_id.job.status,
      };
    }
  }

  return status;
}
