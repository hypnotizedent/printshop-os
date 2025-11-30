
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GarmentSelectorProps {
  selectedGarment: string;
  onGarmentChange: (garment: string) => void;
}

export const GarmentSelector = ({ selectedGarment, onGarmentChange }: GarmentSelectorProps) => {
  const garments = [
    {
      id: 't-shirt',
      name: 'T-Shirt',
      price: '$19.99',
      description: 'Classic cotton tee',
      popular: true
    },
    {
      id: 'hoodie',
      name: 'Hoodie',
      price: '$39.99',
      description: 'Cozy pullover hoodie',
      popular: false
    },
    {
      id: 'tank-top',
      name: 'Tank Top',
      price: '$16.99',
      description: 'Sleeveless comfort',
      popular: false
    }
  ];

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Choose Garment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {garments.map((garment) => (
          <div
            key={garment.id}
            onClick={() => onGarmentChange(garment.id)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
              selectedGarment === garment.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium text-gray-800">{garment.name}</h4>
              <div className="flex items-center gap-2">
                {garment.popular && (
                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                )}
                <span className="font-semibold text-blue-600">{garment.price}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">{garment.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
