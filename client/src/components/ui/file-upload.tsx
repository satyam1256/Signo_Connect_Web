import { useState, useRef, ChangeEvent } from "react";
import { Upload, X, Check, File, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  title: string;
  description?: string;
  accepted?: string;
  buttonText: string;
  onChange: (file: File) => void;
  value?: File | null;
  className?: string;
  helpText?: string;
}

export const FileUpload = ({
  title,
  description,
  accepted = "image/*,.pdf",
  buttonText,
  onChange,
  value,
  className,
  helpText,
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    onChange(file);
    
    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null as any);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn("border border-neutral-200 rounded-md p-4", className)}>
      <h4 className="font-medium text-neutral-800 mb-2">{title}</h4>
      
      {!value && !preview ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-neutral-200",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <Upload className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-neutral-500 mb-3">{description || "Drag & drop or click to upload"}</p>
          
          <div className="flex gap-2 justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
            >
              {buttonText}
            </Button>
            
            {accepted.includes("image/") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTakePhoto();
                }}
              >
                <Camera className="h-4 w-4 mr-1" />
                Take Photo
              </Button>
            )}
          </div>
          
          <input
            type="file"
            className="hidden"
            accept={accepted}
            onChange={handleFileChange}
            ref={fileInputRef}
          />
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-md p-4 relative">
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-6 w-6 absolute top-2 right-2 z-10"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
          
          {preview ? (
            <div className="flex justify-center">
              <img
                src={preview}
                alt="Preview"
                className="max-h-36 object-contain rounded"
              />
            </div>
          ) : (
            <div className="flex items-center p-2">
              <File className="h-8 w-8 text-primary mr-2" />
              <div>
                <p className="text-sm font-medium text-neutral-800 truncate">
                  {value?.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {(value?.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Check className="h-5 w-5 text-green-500 ml-auto" />
            </div>
          )}
        </div>
      )}
      
      {helpText && <p className="text-xs text-neutral-500 mt-2">{helpText}</p>}
    </div>
  );
};
