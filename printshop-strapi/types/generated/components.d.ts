import type { Schema, Struct } from '@strapi/strapi';

export interface CostLaborCost extends Struct.ComponentSchema {
  collectionName: 'components_cost_labor_costs';
  info: {
    description: 'Tracks employee hours and labor costs for jobs';
    displayName: 'Labor Cost';
  };
  attributes: {
    employee: Schema.Attribute.Relation<'oneToOne', 'api::employee.employee'>;
    hourlyRate: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    hoursWorked: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    notes: Schema.Attribute.Text;
    taskType: Schema.Attribute.Enumeration<
      ['setup', 'production', 'cleanup', 'rework']
    > &
      Schema.Attribute.Required;
    totalCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface CostMaterialCost extends Struct.ComponentSchema {
  collectionName: 'components_cost_material_costs';
  info: {
    description: 'Tracks material costs including ink, thread, screens, vinyl, and supplies';
    displayName: 'Material Cost';
  };
  attributes: {
    inkCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    notes: Schema.Attribute.Text;
    otherSupplies: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    screenCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    threadCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    vinylCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface CostSupplierCost extends Struct.ComponentSchema {
  collectionName: 'components_cost_supplier_costs';
  info: {
    description: 'Tracks costs for garments and blanks from suppliers';
    displayName: 'Supplier Cost';
  };
  attributes: {
    invoiceNumber: Schema.Attribute.String;
    itemName: Schema.Attribute.String & Schema.Attribute.Required;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    supplier: Schema.Attribute.String & Schema.Attribute.Required;
    totalCost: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    unitCost: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'cost.labor-cost': CostLaborCost;
      'cost.material-cost': CostMaterialCost;
      'cost.supplier-cost': CostSupplierCost;
    }
  }
}
