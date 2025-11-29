
import { useState } from "react";
import { Upload, Type, Square, Circle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DesignToolsProps {
  onDesignAdd: (designs: any[]) => void;
}

export const DesignTools = ({ onDesignAdd }: DesignToolsProps) => {
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Call the canvas upload function
      (window as any).uploadImageToCanvas?.(file);
    }
  };

  const tools = [
    {
      id: 'upload',
      icon: Upload,
      label: 'Upload',
      description: 'Add your artwork'
    },
    {
      id: 'text',
      icon: Type,
      label: 'Text',
      description: 'Add custom text'
    },
    {
      id: 'shapes',
      icon: Square,
      label: 'Shapes',
      description: 'Add shapes'
    }
  ];

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          Design Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tool Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTab(tool.id)}
              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-md transition-all ${
                activeTab === tool.id
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tool.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Tool Content */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-300 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-3">Drop files here or</p>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                asChild
                variant="outline"
                className="cursor-pointer"
              >
                <label htmlFor="file-upload">Browse Files</label>
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Supported: JPG, PNG, SVG (Max 10MB)
            </p>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-3">
            <Input placeholder="Enter your text" />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">Add Text</Button>
              <Button variant="outline" size="sm">
                <Type className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'shapes' && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              <Square className="h-4 w-4 mr-2" />
              Rectangle
            </Button>
            <Button variant="outline" size="sm">
              <Circle className="h-4 w-4 mr-2" />
              Circle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
