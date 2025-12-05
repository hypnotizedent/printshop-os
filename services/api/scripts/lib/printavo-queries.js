/**
 * Printavo GraphQL Queries
 * 
 * This file contains all GraphQL queries used for extracting data from Printavo.
 * Queries are optimized to stay under the complexity limit of 25000.
 */

/**
 * Order Query - Extracts all invoices and quotes with full field data
 * Complexity: ~4500 per order (use page size of 5 to stay under 25000 limit)
 */
const ORDER_QUERY = `
  query GetOrders($first: Int!, $after: String) {
    orders(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on Invoice {
          id
          visualId
          nickname
          total
          subtotal
          taxTotal
          discountTotal
          amountPaid
          amountOutstanding
          salesTax
          salesTaxAmount
          customerDueAt
          paymentDueAt
          productionNote
          customerNote
          tags
          merch
          publicUrl
          publicPdf
          workorderUrl
          packingSlipUrl
          createdAt
          updatedAt
          
          status {
            id
            name
            color
          }
          
          contact {
            id
            fullName
            firstName
            lastName
            email
            phone
          }
          
          owner {
            id
            email
            name
          }
          
          customer {
            id
            company
            email
            phone
          }
          
          billingAddress {
            companyName
            customerName
            address1
            address2
            city
            stateIso
            zipCode
            country
          }
          
          shippingAddress {
            companyName
            customerName
            address1
            address2
            city
            stateIso
            zipCode
            country
          }
          
          productionFiles {
            nodes {
              id
              fileUrl
              fileName
              fileType
              fileSize
            }
          }
          
          lineItemGroups {
            nodes {
              id
              position
              imprints {
                nodes {
                  id
                  name
                  placement
                  description
                  colors
                  stitchCount
                  printMethod
                  mockupUrl
                  artworkFiles {
                    nodes {
                      id
                      fileUrl
                      fileName
                      fileType
                    }
                  }
                }
              }
              mockups {
                nodes {
                  id
                  url
                  name
                }
              }
              lineItems {
                nodes {
                  id
                  description
                  color
                  items
                  price
                  category {
                    id
                    name
                  }
                  sizes {
                    size
                    count
                  }
                  personalizations {
                    name
                    number
                    size
                  }
                  product {
                    id
                    name
                    sku
                    description
                  }
                }
              }
            }
          }
        }
        
        ... on Quote {
          id
          visualId
          nickname
          total
          subtotal
          expiresAt
          createdAt
          updatedAt
          productionNote
          customerNote
          tags
          publicUrl
          publicPdf
          
          status {
            id
            name
            color
          }
          
          contact {
            id
            fullName
            firstName
            lastName
            email
            phone
          }
          
          customer {
            id
            company
            email
            phone
          }
          
          billingAddress {
            companyName
            customerName
            address1
            address2
            city
            stateIso
            zipCode
            country
          }
          
          shippingAddress {
            companyName
            customerName
            address1
            address2
            city
            stateIso
            zipCode
            country
          }
          
          lineItemGroups {
            nodes {
              id
              position
              imprints {
                nodes {
                  id
                  name
                  placement
                  description
                  colors
                  printMethod
                  mockupUrl
                }
              }
              mockups {
                nodes {
                  id
                  url
                  name
                }
              }
              lineItems {
                nodes {
                  id
                  description
                  color
                  items
                  price
                  sizes {
                    size
                    count
                  }
                  product {
                    id
                    name
                    sku
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Customer Query - Extracts all customers with contacts and addresses
 * Complexity: ~800 per customer (use page size of 25 to stay under 25000 limit)
 */
const CUSTOMER_QUERY = `
  query GetCustomers($first: Int!, $after: String) {
    customers(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        firstName
        lastName
        company
        email
        phone
        internalNote
        resaleNumber
        salesTax
        taxExempt
        createdAt
        updatedAt
        
        billingAddress {
          id
          name
          companyName
          customerName
          address1
          address2
          city
          state
          stateIso
          zip
          zipCode
          country
        }
        
        shippingAddress {
          id
          name
          companyName
          customerName
          address1
          address2
          city
          state
          stateIso
          zip
          zipCode
          country
        }
        
        primaryContact {
          id
          fullName
          firstName
          lastName
          email
          phone
        }
        
        contacts {
          id
          fullName
          firstName
          lastName
          email
          phone
        }
      }
    }
  }
`;

/**
 * Incremental Order Query - Extracts orders after a specific date
 * Used for incremental syncs during transition period
 */
const INCREMENTAL_ORDER_QUERY = `
  query GetOrdersSince($first: Int!, $after: String, $since: ISO8601DateTime!) {
    orders(first: $first, after: $after, updatedAfter: $since) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on Invoice {
          id
          visualId
          nickname
          total
          subtotal
          taxTotal
          discountTotal
          amountPaid
          amountOutstanding
          salesTax
          salesTaxAmount
          customerDueAt
          paymentDueAt
          productionNote
          customerNote
          tags
          publicUrl
          publicPdf
          workorderUrl
          packingSlipUrl
          createdAt
          updatedAt
          
          status {
            id
            name
            color
          }
          
          contact {
            id
            fullName
            firstName
            lastName
            email
            phone
          }
          
          customer {
            id
            company
            email
            phone
          }
          
          billingAddress {
            companyName
            customerName
            address1
            address2
            city
            stateIso
            zipCode
          }
          
          shippingAddress {
            companyName
            customerName
            address1
            address2
            city
            stateIso
            zipCode
          }
          
          lineItemGroups {
            nodes {
              id
              position
              lineItems {
                nodes {
                  id
                  description
                  color
                  items
                  price
                  sizes {
                    size
                    count
                  }
                  product {
                    id
                    name
                    sku
                  }
                }
              }
            }
          }
        }
        
        ... on Quote {
          id
          visualId
          nickname
          total
          subtotal
          createdAt
          updatedAt
          
          status {
            id
            name
          }
          
          customer {
            id
            company
          }
          
          lineItemGroups {
            nodes {
              id
              lineItems {
                nodes {
                  id
                  description
                  items
                  price
                }
              }
            }
          }
        }
      }
    }
  }
`;

module.exports = {
  ORDER_QUERY,
  CUSTOMER_QUERY,
  INCREMENTAL_ORDER_QUERY
};
