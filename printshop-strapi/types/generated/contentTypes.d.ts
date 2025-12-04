import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminAuditLog extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_audit_logs';
  info: {
    displayName: 'Audit Log';
    pluralName: 'audit-logs';
    singularName: 'audit-log';
  };
  options: {
    draftAndPublish: false;
    timestamps: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::audit-log'> &
      Schema.Attribute.Private;
    payload: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<'oneToOne', 'admin::user'>;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiColorColor extends Struct.CollectionTypeSchema {
  collectionName: 'colors';
  info: {
    description: 'Canonical production color (ink, thread, etc.)';
    displayName: 'Color';
    pluralName: 'colors';
    singularName: 'color';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    finish: Schema.Attribute.String;
    hex: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::color.color'> &
      Schema.Attribute.Private;
    medium: Schema.Attribute.Enumeration<['ink', 'thread']> &
      Schema.Attribute.Required;
    meta: Schema.Attribute.JSON;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    pantone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    similar: Schema.Attribute.JSON;
    slug: Schema.Attribute.UID<'name'> &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    tags: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    usageConstraints: Schema.Attribute.JSON;
    vendor: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiCustomOrderCustomOrder extends Struct.CollectionTypeSchema {
  collectionName: 'custom_orders';
  info: {
    description: 'Custom design orders from the online designer';
    displayName: 'Custom Order';
    pluralName: 'custom-orders';
    singularName: 'custom-order';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    canvasData: Schema.Attribute.JSON;
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customer: Schema.Attribute.Relation<'manyToOne', 'api::customer.customer'>;
    customerEmail: Schema.Attribute.Email;
    customerId: Schema.Attribute.String;
    designs: Schema.Attribute.JSON & Schema.Attribute.Required;
    designSession: Schema.Attribute.Relation<
      'oneToOne',
      'api::design-session.design-session'
    >;
    garmentColor: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'#FFFFFF'>;
    garmentType: Schema.Attribute.Enumeration<
      [
        't-shirt',
        'hoodie',
        'tank-top',
        'long-sleeve',
        'polo',
        'sweatshirt',
        'hat',
        'jacket',
      ]
    > &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::custom-order.custom-order'
    > &
      Schema.Attribute.Private;
    mockupUrl: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    order: Schema.Attribute.Relation<'manyToOne', 'api::order.order'>;
    pricing: Schema.Attribute.JSON & Schema.Attribute.Required;
    printMethod: Schema.Attribute.Enumeration<
      ['screen-print', 'dtg', 'embroidery', 'heat-transfer', 'sublimation']
    > &
      Schema.Attribute.DefaultTo<'screen-print'>;
    productionFiles: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    rushOrder: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    sessionId: Schema.Attribute.String & Schema.Attribute.Required;
    size: Schema.Attribute.String;
    status: Schema.Attribute.Enumeration<
      ['pending', 'processing', 'in-production', 'completed', 'cancelled']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pending'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCustomerActivityCustomerActivity
  extends Struct.CollectionTypeSchema {
  collectionName: 'customer_activities';
  info: {
    description: 'Customer account activity log';
    displayName: 'Customer Activity';
    pluralName: 'customer-activities';
    singularName: 'customer-activity';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activityType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customer: Schema.Attribute.Relation<'manyToOne', 'api::customer.customer'>;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    ipAddress: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::customer-activity.customer-activity'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCustomerPreferenceCustomerPreference
  extends Struct.CollectionTypeSchema {
  collectionName: 'customer_preferences';
  info: {
    description: 'Customer notification and communication preferences';
    displayName: 'Customer Preference';
    pluralName: 'customer-preferences';
    singularName: 'customer-preference';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    artApproval: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customer: Schema.Attribute.Relation<'oneToOne', 'api::customer.customer'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::customer-preference.customer-preference'
    > &
      Schema.Attribute.Private;
    marketingEmails: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    orderConfirmation: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    productionUpdates: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    publishedAt: Schema.Attribute.DateTime;
    quoteReminders: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    shipmentNotifications: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    smsNotifications: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCustomerCustomer extends Struct.CollectionTypeSchema {
  collectionName: 'customers';
  info: {
    description: 'Customer accounts';
    displayName: 'Customer';
    pluralName: 'customers';
    singularName: 'customer';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address: Schema.Attribute.Text;
    city: Schema.Attribute.String;
    company: Schema.Attribute.String;
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    jobs: Schema.Attribute.Relation<'oneToMany', 'api::job.job'>;
    lastSegmentUpdate: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::customer.customer'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    orders: Schema.Attribute.Relation<'oneToMany', 'api::order.order'>;
    passwordHash: Schema.Attribute.String & Schema.Attribute.Private;
    phone: Schema.Attribute.String;
    printavoId: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    segment: Schema.Attribute.Enumeration<['vip', 'b2b', 'middleman', 'b2c']> &
      Schema.Attribute.DefaultTo<'b2c'>;
    segmentAutoDetected: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    segmentDetails: Schema.Attribute.JSON;
    state: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    zipCode: Schema.Attribute.String;
  };
}

export interface ApiDesignSessionDesignSession
  extends Struct.CollectionTypeSchema {
  collectionName: 'design_sessions';
  info: {
    description: 'Customer design sessions for the online designer tool';
    displayName: 'Design Session';
    pluralName: 'design-sessions';
    singularName: 'design-session';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    canvasData: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customer: Schema.Attribute.Relation<'manyToOne', 'api::customer.customer'>;
    customerEmail: Schema.Attribute.Email;
    customerId: Schema.Attribute.String;
    designs: Schema.Attribute.JSON & Schema.Attribute.Required;
    garmentColor: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'#FFFFFF'>;
    garmentSize: Schema.Attribute.Enumeration<
      ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL']
    > &
      Schema.Attribute.DefaultTo<'M'>;
    garmentType: Schema.Attribute.Enumeration<
      [
        't-shirt',
        'hoodie',
        'tank-top',
        'long-sleeve',
        'polo',
        'sweatshirt',
        'hat',
        'jacket',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'t-shirt'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::design-session.design-session'
    > &
      Schema.Attribute.Private;
    mockupUrl: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    pricing: Schema.Attribute.JSON & Schema.Attribute.Required;
    printMethod: Schema.Attribute.Enumeration<
      ['screen-print', 'dtg', 'embroidery', 'heat-transfer', 'sublimation']
    > &
      Schema.Attribute.DefaultTo<'screen-print'>;
    productId: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    shareToken: Schema.Attribute.String;
    status: Schema.Attribute.Enumeration<
      ['draft', 'active', 'quoted', 'ordered', 'completed', 'abandoned']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'active'>;
    thumbnailUrl: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEmployeeEmployee extends Struct.CollectionTypeSchema {
  collectionName: 'employees';
  info: {
    description: 'Production floor employees for time clock and job tracking';
    displayName: 'Employee';
    pluralName: 'employees';
    singularName: 'employee';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    department: Schema.Attribute.Enumeration<
      ['screen_printing', 'embroidery', 'digital']
    >;
    email: Schema.Attribute.Email & Schema.Attribute.Unique;
    firstName: Schema.Attribute.String & Schema.Attribute.Required;
    hireDate: Schema.Attribute.Date;
    hourlyRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<20>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastName: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::employee.employee'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    phone: Schema.Attribute.String;
    pin: Schema.Attribute.String &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
        minLength: 4;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Enumeration<['operator', 'supervisor', 'admin']> &
      Schema.Attribute.DefaultTo<'operator'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiFileEventFileEvent extends Struct.CollectionTypeSchema {
  collectionName: 'file_events';
  info: {
    description: 'Audit log for production file movements (hot folder system)';
    displayName: 'File Event';
    pluralName: 'file-events';
    singularName: 'file-event';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    destinationLocation: Schema.Attribute.String;
    errorMessage: Schema.Attribute.Text;
    eventType: Schema.Attribute.Enumeration<
      [
        'uploaded',
        'approved',
        'sent_to_machine',
        'started_processing',
        'completed',
        'archived',
        'error',
        'deleted',
      ]
    > &
      Schema.Attribute.Required;
    fileName: Schema.Attribute.String & Schema.Attribute.Required;
    filePath: Schema.Attribute.String & Schema.Attribute.Required;
    fileSize: Schema.Attribute.BigInteger;
    fileType: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::file-event.file-event'
    > &
      Schema.Attribute.Private;
    machineId: Schema.Attribute.String;
    machineName: Schema.Attribute.String;
    metadata: Schema.Attribute.JSON;
    operatorId: Schema.Attribute.String;
    operatorName: Schema.Attribute.String;
    orderId: Schema.Attribute.String;
    orderNumber: Schema.Attribute.String;
    processingDuration: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    sourceLocation: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiImprintImprint extends Struct.CollectionTypeSchema {
  collectionName: 'imprints';
  info: {
    description: 'Decoration/imprint details for line items (screen print, embroidery, etc.)';
    displayName: 'Imprint';
    pluralName: 'imprints';
    singularName: 'imprint';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    artworkUrl: Schema.Attribute.String;
    colorCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    colors: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    decorationType: Schema.Attribute.Enumeration<
      [
        'Screen Print',
        'Embroidery',
        'DTG',
        'DTF',
        'Vinyl',
        'Sublimation',
        'Other',
      ]
    > &
      Schema.Attribute.DefaultTo<'Screen Print'>;
    description: Schema.Attribute.Text;
    hasUnderbase: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    height: Schema.Attribute.Decimal;
    imprintNumber: Schema.Attribute.String & Schema.Attribute.Required;
    lineItem: Schema.Attribute.Relation<
      'manyToOne',
      'api::line-item.line-item'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::imprint.imprint'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.Enumeration<
      [
        'Full Front',
        'Full Back',
        'Left Chest',
        'Right Chest',
        'Left Sleeve',
        'Right Sleeve',
        'Nape',
        'Pocket',
        'Left Leg',
        'Right Leg',
        'Other',
      ]
    >;
    locationSize: Schema.Attribute.Enumeration<
      ['Small', 'Medium', 'Large', 'Extra Large', 'Custom']
    >;
    order: Schema.Attribute.Relation<'manyToOne', 'api::order.order'>;
    printavoId: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    setupComplete: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    stitchCount: Schema.Attribute.Integer;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    width: Schema.Attribute.Decimal;
  };
}

export interface ApiJobCostJobCost extends Struct.CollectionTypeSchema {
  collectionName: 'job_costs';
  info: {
    description: 'Cost tracking and profit calculation for jobs';
    displayName: 'Job Cost';
    pluralName: 'job-costs';
    singularName: 'job-cost';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    costEnteredAt: Schema.Attribute.DateTime;
    costEnteredBy: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    job: Schema.Attribute.Relation<'oneToOne', 'api::job.job'>;
    laborCosts: Schema.Attribute.Component<'cost.labor-cost', true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::job-cost.job-cost'
    > &
      Schema.Attribute.Private;
    materialCosts: Schema.Attribute.Component<'cost.material-cost', false>;
    overheadCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    overheadPercentage: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<15>;
    profit: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    profitMargin: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    revenue: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    supplierCosts: Schema.Attribute.Component<'cost.supplier-cost', true>;
    totalCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    totalLaborCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    totalMaterialCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    totalSupplierCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiJobJob extends Struct.CollectionTypeSchema {
  collectionName: 'jobs';
  info: {
    description: 'Production jobs';
    displayName: 'Job';
    pluralName: 'jobs';
    singularName: 'job';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assignedEmployee: Schema.Attribute.Relation<
      'manyToOne',
      'api::employee.employee'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customer: Schema.Attribute.Relation<'manyToOne', 'api::customer.customer'>;
    department: Schema.Attribute.Enumeration<
      ['screen_printing', 'embroidery', 'digital']
    >;
    dueDate: Schema.Attribute.Date;
    jobNumber: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::job.job'> &
      Schema.Attribute.Private;
    order: Schema.Attribute.Relation<'manyToOne', 'api::order.order'>;
    printavoId: Schema.Attribute.String;
    printMethod: Schema.Attribute.String;
    productDescription: Schema.Attribute.Text;
    productionNotes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Integer;
    status: Schema.Attribute.String;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLineItemLineItem extends Struct.CollectionTypeSchema {
  collectionName: 'line_items';
  info: {
    description: 'Order line items with individual size quantities - matches Printavo data model';
    displayName: 'Line Item';
    pluralName: 'line-items';
    singularName: 'line-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    category: Schema.Attribute.String;
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    goodsStatus: Schema.Attribute.String;
    imprints: Schema.Attribute.Relation<'oneToMany', 'api::imprint.imprint'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::line-item.line-item'
    > &
      Schema.Attribute.Private;
    order: Schema.Attribute.Relation<'manyToOne', 'api::order.order'>;
    orderId: Schema.Attribute.BigInteger;
    orderVisualId: Schema.Attribute.String;
    printavoId: Schema.Attribute.String & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    size12M: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size18M: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size24M: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size2T: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size2XL: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size3T: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size3XL: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size4T: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size4XL: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size5T: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size5XL: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    size6M: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeL: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeM: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeOther: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeS: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeXL: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeXS: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeYL: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeYM: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeYS: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeYXL: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sizeYXS: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    styleDescription: Schema.Attribute.Text;
    styleNumber: Schema.Attribute.String;
    taxable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    totalCost: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalQuantity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    unitCost: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMachineMachine extends Struct.CollectionTypeSchema {
  collectionName: 'machines';
  info: {
    description: 'Production equipment for time tracking and job assignment';
    displayName: 'Machine';
    pluralName: 'machines';
    singularName: 'machine';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    department: Schema.Attribute.Enumeration<
      [
        'screen-printing',
        'embroidery',
        'digital',
        'admin',
        'finishing',
        'shipping',
      ]
    > &
      Schema.Attribute.Required;
    hotFolderCompleted: Schema.Attribute.String;
    hotFolderIncoming: Schema.Attribute.String;
    hotFolderProcessing: Schema.Attribute.String;
    lastMaintenanceDate: Schema.Attribute.Date;
    lastSeen: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::machine.machine'
    > &
      Schema.Attribute.Private;
    machineId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    manufacturer: Schema.Attribute.String;
    model: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    networkAddress: Schema.Attribute.String;
    nextMaintenanceDate: Schema.Attribute.Date;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['active', 'idle', 'running', 'maintenance', 'offline', 'retired']
    > &
      Schema.Attribute.DefaultTo<'active'>;
    type: Schema.Attribute.Enumeration<
      [
        'auto-press',
        'manual-press',
        'dryer',
        'embroidery-head',
        'dtg-printer',
        'dtf-printer',
        'sublimation',
        'heat-press',
        'label-printer',
        'vinyl-cutter',
        'other',
      ]
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiNotificationPreferenceNotificationPreference
  extends Struct.CollectionTypeSchema {
  collectionName: 'notification_preferences';
  info: {
    description: 'Customer notification preferences for multi-channel communications (email/SMS)';
    displayName: 'Notification Preference';
    pluralName: 'notification-preferences';
    singularName: 'notification-preference';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customer: Schema.Attribute.Relation<'oneToOne', 'api::customer.customer'>;
    emailAddress: Schema.Attribute.Email;
    emailEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::notification-preference.notification-preference'
    > &
      Schema.Attribute.Private;
    preferences: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<{
        artwork_ready: {
          email: true;
          sms: false;
        };
        garments_arrived: {
          email: true;
          sms: false;
        };
        in_production: {
          email: true;
          sms: false;
        };
        payment_received: {
          email: true;
          sms: false;
        };
        quality_check: {
          email: true;
          sms: false;
        };
        ready_for_pickup: {
          email: true;
          sms: true;
        };
        shipped: {
          email: true;
          sms: true;
        };
      }>;
    publishedAt: Schema.Attribute.DateTime;
    smsEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    smsForPickupOnly: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    smsPhone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiOrderOrder extends Struct.CollectionTypeSchema {
  collectionName: 'orders';
  info: {
    description: 'Customer orders';
    displayName: 'Order';
    pluralName: 'orders';
    singularName: 'order';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amountOutstanding: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    amountPaid: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    approved: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    approvedAt: Schema.Attribute.DateTime;
    approvedBy: Schema.Attribute.String;
    billingAddress: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customer: Schema.Attribute.Relation<'manyToOne', 'api::customer.customer'>;
    customerDueDate: Schema.Attribute.Date;
    customerPO: Schema.Attribute.String;
    deliveryMethod: Schema.Attribute.Enumeration<
      ['pickup', 'ship', 'delivery', 'other']
    >;
    discount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    dueDate: Schema.Attribute.Date;
    fees: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    invoiceDate: Schema.Attribute.Date;
    items: Schema.Attribute.JSON;
    jobs: Schema.Attribute.Relation<'oneToMany', 'api::job.job'>;
    lineItems: Schema.Attribute.Relation<
      'oneToMany',
      'api::line-item.line-item'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::order.order'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    orderNickname: Schema.Attribute.String;
    orderNumber: Schema.Attribute.String & Schema.Attribute.Required;
    paymentDueDate: Schema.Attribute.Date;
    payments: Schema.Attribute.Relation<'oneToMany', 'api::payment.payment'>;
    printavoCustomerId: Schema.Attribute.String;
    printavoId: Schema.Attribute.String & Schema.Attribute.Unique;
    productionDueDate: Schema.Attribute.Date;
    productionNotes: Schema.Attribute.Text;
    publicHash: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    salesTax: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    shippingAddress: Schema.Attribute.JSON;
    status: Schema.Attribute.Enumeration<
      [
        'QUOTE',
        'QUOTE_SENT',
        'QUOTE_APPROVED',
        'IN_PRODUCTION',
        'COMPLETE',
        'READY_FOR_PICKUP',
        'SHIPPED',
        'PAYMENT_NEEDED',
        'INVOICE_PAID',
        'CANCELLED',
      ]
    > &
      Schema.Attribute.DefaultTo<'QUOTE'>;
    totalAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    visualId: Schema.Attribute.String;
  };
}

export interface ApiOwnerOwner extends Struct.CollectionTypeSchema {
  collectionName: 'owners';
  info: {
    description: 'Shop owners with full admin access';
    displayName: 'Owner';
    pluralName: 'owners';
    singularName: 'owner';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastLogin: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::owner.owner'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    passwordHash: Schema.Attribute.String & Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    twoFactorEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    twoFactorSecret: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPaymentPayment extends Struct.CollectionTypeSchema {
  collectionName: 'payments';
  info: {
    description: 'Payment records for orders';
    displayName: 'Payment';
    pluralName: 'payments';
    singularName: 'payment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    checkoutUrl: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::payment.payment'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    notes: Schema.Attribute.Text;
    order: Schema.Attribute.Relation<'manyToOne', 'api::order.order'>;
    paidAt: Schema.Attribute.DateTime;
    paymentDate: Schema.Attribute.Date;
    paymentMethod: Schema.Attribute.Enumeration<
      [
        'stripe',
        'cash',
        'check',
        'credit_card',
        'ach',
        'bank_transfer',
        'other',
      ]
    > &
      Schema.Attribute.DefaultTo<'cash'>;
    paymentType: Schema.Attribute.Enumeration<
      ['deposit', 'balance', 'full', 'refund']
    > &
      Schema.Attribute.DefaultTo<'full'>;
    publishedAt: Schema.Attribute.DateTime;
    receiptUrl: Schema.Attribute.String;
    recordedBy: Schema.Attribute.String;
    referenceNumber: Schema.Attribute.String;
    refundAmount: Schema.Attribute.Decimal;
    refundedAt: Schema.Attribute.DateTime;
    refundReason: Schema.Attribute.Text;
    status: Schema.Attribute.Enumeration<
      [
        'pending',
        'processing',
        'paid',
        'failed',
        'refunded',
        'expired',
        'cancelled',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pending'>;
    stripeCheckoutSessionId: Schema.Attribute.String;
    stripeCustomerId: Schema.Attribute.String;
    stripePaymentIntentId: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPriceCalculationPriceCalculation
  extends Struct.CollectionTypeSchema {
  collectionName: 'price_calculations';
  info: {
    description: 'Pricing history and audit trail';
    displayName: 'Price Calculation';
    pluralName: 'price-calculations';
    singularName: 'price-calculation';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    calculation_time_ms: Schema.Attribute.Integer;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customer_type: Schema.Attribute.String;
    garment_id: Schema.Attribute.String;
    input: Schema.Attribute.JSON & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::price-calculation.price-calculation'
    > &
      Schema.Attribute.Private;
    margin_pct: Schema.Attribute.Decimal & Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    order_id: Schema.Attribute.String;
    output: Schema.Attribute.JSON & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Integer & Schema.Attribute.Required;
    quote_id: Schema.Attribute.String;
    rules_applied: Schema.Attribute.JSON;
    service: Schema.Attribute.String;
    total_price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPricingRulePricingRule extends Struct.CollectionTypeSchema {
  collectionName: 'pricing_rules';
  info: {
    description: 'JSON-based pricing rules with versioning';
    displayName: 'Pricing Rule';
    pluralName: 'pricing-rules';
    singularName: 'pricing-rule';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    calculations: Schema.Attribute.JSON & Schema.Attribute.Required;
    conditions: Schema.Attribute.JSON & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    effective_date: Schema.Attribute.Date & Schema.Attribute.Required;
    enabled: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    expiry_date: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::pricing-rule.pricing-rule'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    priority: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<1>;
    publishedAt: Schema.Attribute.DateTime;
    rule_id: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    version: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<1>;
  };
}

export interface ApiProductProduct extends Struct.CollectionTypeSchema {
  collectionName: 'products';
  info: {
    description: 'Curated supplier products catalog (Top 500). Live inventory via /api/inventory/check/:sku';
    displayName: 'Product';
    pluralName: 'products';
    singularName: 'product';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    basePrice: Schema.Attribute.Decimal;
    brand: Schema.Attribute.String;
    category: Schema.Attribute.Enumeration<
      [
        't-shirts',
        'polos',
        'sweatshirts',
        'hoodies',
        'jackets',
        'pants',
        'shorts',
        'hats',
        'bags',
        'accessories',
        'workwear',
        'athletic',
        'outerwear',
        'youth',
        'other',
      ]
    > &
      Schema.Attribute.DefaultTo<'other'>;
    colors: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    images: Schema.Attribute.JSON;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isCurated: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isFavorite: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isTopProduct: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lastOrderedAt: Schema.Attribute.DateTime;
    lastSyncedAt: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::product.product'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    orderCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    priceBreaks: Schema.Attribute.JSON;
    priority: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    sizes: Schema.Attribute.JSON;
    sku: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    specifications: Schema.Attribute.JSON;
    supplier: Schema.Attribute.Enumeration<
      ['sanmar', 'ascolour', 'ssactivewear']
    > &
      Schema.Attribute.Required;
    supplierProductId: Schema.Attribute.String;
    tags: Schema.Attribute.JSON;
    topProductScore: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalUnitsOrdered: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    usageCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiQuoteQuote extends Struct.CollectionTypeSchema {
  collectionName: 'quotes';
  info: {
    description: 'Customer quotes with approval workflow';
    displayName: 'Quote';
    pluralName: 'quotes';
    singularName: 'quote';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    approvalToken: Schema.Attribute.String & Schema.Attribute.Private;
    approvedAt: Schema.Attribute.DateTime;
    approvedBy: Schema.Attribute.String;
    approverSignature: Schema.Attribute.Text;
    attachments: Schema.Attribute.Media<'images' | 'files', true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customer: Schema.Attribute.Relation<'manyToOne', 'api::customer.customer'>;
    customerNotes: Schema.Attribute.Text;
    depositAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    depositPercent: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<50>;
    depositRequired: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    discount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    discountType: Schema.Attribute.Enumeration<['percentage', 'fixed']> &
      Schema.Attribute.DefaultTo<'fixed'>;
    expiresAt: Schema.Attribute.DateTime;
    internalNotes: Schema.Attribute.Text;
    lineItems: Schema.Attribute.JSON & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::quote.quote'> &
      Schema.Attribute.Private;
    mockupUrls: Schema.Attribute.JSON;
    order: Schema.Attribute.Relation<'oneToOne', 'api::order.order'>;
    parentQuote: Schema.Attribute.Relation<'oneToOne', 'api::quote.quote'>;
    publishedAt: Schema.Attribute.DateTime;
    quoteNumber: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    rejectedAt: Schema.Attribute.DateTime;
    rejectionReason: Schema.Attribute.Text;
    revisionNumber: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    sentAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      [
        'draft',
        'sent',
        'viewed',
        'approved',
        'rejected',
        'expired',
        'converted',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    subtotal: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    taxAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    taxRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    terms: Schema.Attribute.RichText;
    total: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    validDays: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<30>;
    viewedAt: Schema.Attribute.DateTime;
  };
}

export interface ApiSopSop extends Struct.CollectionTypeSchema {
  collectionName: 'sops';
  info: {
    description: 'Standard Operating Procedure';
    displayName: 'SOP';
    pluralName: 'sops';
    singularName: 'sop';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: false;
    };
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      ['Machines', 'Processes', 'Troubleshooting', 'Safety']
    > &
      Schema.Attribute.Required;
    changelog: Schema.Attribute.JSON;
    content: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    difficulty: Schema.Attribute.Enumeration<
      ['Beginner', 'Intermediate', 'Advanced']
    > &
      Schema.Attribute.DefaultTo<'Beginner'>;
    effectiveDate: Schema.Attribute.Date;
    estimatedTime: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    favorites: Schema.Attribute.JSON;
    isPublished: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lastViewed: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::sop.sop'> &
      Schema.Attribute.Private;
    machineId: Schema.Attribute.String;
    media: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    relatedSOPs: Schema.Attribute.Relation<'manyToMany', 'api::sop.sop'>;
    revisionNotes: Schema.Attribute.Text;
    slug: Schema.Attribute.UID<'title'> & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['draft', 'active', 'deprecated']> &
      Schema.Attribute.DefaultTo<'draft'>;
    steps: Schema.Attribute.JSON;
    subcategory: Schema.Attribute.String;
    summary: Schema.Attribute.Text;
    tags: Schema.Attribute.JSON;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    version: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    viewCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiTimeClockEntryTimeClockEntry
  extends Struct.CollectionTypeSchema {
  collectionName: 'time_clock_entries';
  info: {
    description: 'Employee time clock entries for job tracking and labor cost calculation';
    displayName: 'Time Clock Entry';
    pluralName: 'time-clock-entries';
    singularName: 'time-clock-entry';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    breakTime: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    clockIn: Schema.Attribute.DateTime & Schema.Attribute.Required;
    clockOut: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    editApprovedBy: Schema.Attribute.Relation<
      'manyToOne',
      'api::employee.employee'
    >;
    editedBy: Schema.Attribute.Relation<'manyToOne', 'api::employee.employee'>;
    editReason: Schema.Attribute.Text;
    employee: Schema.Attribute.Relation<'manyToOne', 'api::employee.employee'>;
    issues: Schema.Attribute.Text;
    job: Schema.Attribute.Relation<'manyToOne', 'api::job.job'>;
    laborCost: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::time-clock-entry.time-clock-entry'
    > &
      Schema.Attribute.Private;
    machineId: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    pausedAt: Schema.Attribute.DateTime;
    productiveTime: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['Active', 'Paused', 'Completed', 'Edited', 'PendingApproval']
    > &
      Schema.Attribute.DefaultTo<'Active'>;
    taskType: Schema.Attribute.Enumeration<
      ['setup', 'production', 'cleanup', 'break', 'maintenance', 'training']
    > &
      Schema.Attribute.DefaultTo<'production'>;
    totalTime: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.String;
    caption: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.String;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::audit-log': AdminAuditLog;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::color.color': ApiColorColor;
      'api::custom-order.custom-order': ApiCustomOrderCustomOrder;
      'api::customer-activity.customer-activity': ApiCustomerActivityCustomerActivity;
      'api::customer-preference.customer-preference': ApiCustomerPreferenceCustomerPreference;
      'api::customer.customer': ApiCustomerCustomer;
      'api::design-session.design-session': ApiDesignSessionDesignSession;
      'api::employee.employee': ApiEmployeeEmployee;
      'api::file-event.file-event': ApiFileEventFileEvent;
      'api::imprint.imprint': ApiImprintImprint;
      'api::job-cost.job-cost': ApiJobCostJobCost;
      'api::job.job': ApiJobJob;
      'api::line-item.line-item': ApiLineItemLineItem;
      'api::machine.machine': ApiMachineMachine;
      'api::notification-preference.notification-preference': ApiNotificationPreferenceNotificationPreference;
      'api::order.order': ApiOrderOrder;
      'api::owner.owner': ApiOwnerOwner;
      'api::payment.payment': ApiPaymentPayment;
      'api::price-calculation.price-calculation': ApiPriceCalculationPriceCalculation;
      'api::pricing-rule.pricing-rule': ApiPricingRulePricingRule;
      'api::product.product': ApiProductProduct;
      'api::quote.quote': ApiQuoteQuote;
      'api::sop.sop': ApiSopSop;
      'api::time-clock-entry.time-clock-entry': ApiTimeClockEntryTimeClockEntry;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
