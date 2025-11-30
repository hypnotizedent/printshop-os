import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, Circle, Rect } from "fabric";
import { toast } from "sonner";

interface DesignCanvasProps {
  selectedGarment: string;
  designs: any[];
  onDesignChange: (designs: any[]) => void;
}

export const DesignCanvas = ({ selectedGarment, designs, onDesignChange }: DesignCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 400,
      height: 500,
      backgroundColor: "#f8f9fa",
    });

    setFabricCanvas(canvas);
    
    // Add garment silhouette background
    updateGarmentSilhouette(canvas, selectedGarment);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (fabricCanvas) {
      updateGarmentSilhouette(fabricCanvas, selectedGarment);
    }
  }, [selectedGarment, fabricCanvas]);

  const updateGarmentSilhouette = (canvas: FabricCanvas, garment: string) => {
    // Remove existing garment silhouette
    const existingGarment = canvas.getObjects().find(obj => (obj as any).isGarment);
    if (existingGarment) {
      canvas.remove(existingGarment);
    }

    // Create garment silhouette based on selection
    let garmentShape;
    
    switch (garment) {
      case 't-shirt':
        garmentShape = createTShirtSilhouette(canvas);
        break;
      case 'hoodie':
        garmentShape = createHoodieSilhouette(canvas);
        break;
      case 'tank-top':
        garmentShape = createTankTopSilhouette(canvas);
        break;
      default:
        garmentShape = createTShirtSilhouette(canvas);
    }

    (garmentShape as any).isGarment = true;
    garmentShape.selectable = false;
    garmentShape.evented = false;
    canvas.add(garmentShape);
    canvas.sendObjectToBack(garmentShape);
    canvas.renderAll();
  };

  const createTShirtSilhouette = (canvas: FabricCanvas) => {
    const rect = new Rect({
      left: 50,
      top: 100,
      width: 300,
      height: 350,
      fill: 'rgba(255, 255, 255, 0.9)',
      stroke: '#e2e8f0',
      strokeWidth: 2,
      rx: 20,
      ry: 20,
    });
    return rect;
  };

  const createHoodieSilhouette = (canvas: FabricCanvas) => {
    const rect = new Rect({
      left: 50,
      top: 80,
      width: 300,
      height: 380,
      fill: 'rgba(255, 255, 255, 0.9)',
      stroke: '#e2e8f0',
      strokeWidth: 2,
      rx: 25,
      ry: 25,
    });
    return rect;
  };

  const createTankTopSilhouette = (canvas: FabricCanvas) => {
    const rect = new Rect({
      left: 80,
      top: 100,
      width: 240,
      height: 350,
      fill: 'rgba(255, 255, 255, 0.9)',
      stroke: '#e2e8f0',
      strokeWidth: 2,
      rx: 15,
      ry: 15,
    });
    return rect;
  };

  const handleImageUpload = async (file: File) => {
    if (!fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgElement = new Image();
      imgElement.onload = () => {
        FabricImage.fromURL(event.target?.result as string).then((fabricImage) => {
          fabricImage.scale(0.3);
          fabricImage.set({
            left: 150,
            top: 200,
          });
          fabricCanvas.add(fabricImage);
          fabricCanvas.renderAll();
          
          // Update designs array
          const newDesigns = fabricCanvas.getObjects().filter(obj => !(obj as any).isGarment);
          onDesignChange(newDesigns);
          
          toast.success("Image uploaded successfully!");
        });
      };
      imgElement.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Expose upload function to parent
  (window as any).uploadImageToCanvas = handleImageUpload;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 capitalize">
          {selectedGarment.replace('-', ' ')} Preview
        </h3>
        <p className="text-sm text-gray-500">Drag and position your designs</p>
      </div>
      
      <div className="flex justify-center">
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
          <canvas 
            ref={canvasRef} 
            className="border border-gray-200 rounded-lg shadow-sm bg-white"
          />
        </div>
      </div>
    </div>
  );
};
