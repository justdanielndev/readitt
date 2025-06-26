'use client';
import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UserContextManager } from '@/lib/userContext';
interface ImageUploadModalProps {
  storyId: string;
  currentImageUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onImageUpdated: (imageUrl: string | null) => void;
}
export function ImageUploadModal({ storyId, currentImageUrl, isOpen, onClose, onImageUpdated }: ImageUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };
  const uploadImage = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const userManager = UserContextManager.getInstance();
      const userContext = userManager.getUserContext();
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${storyId}-${Date.now()}.${fileExt}`;
      const filePath = `story-covers/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image');
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      const { error: updateError } = await supabase
        .from('stories')
        .update({ 
          image_url: publicUrl,
          last_updated: new Date().toISOString()
        })
        .eq('id', storyId)
        .eq('author_user_id', userContext.userId);
      if (updateError) {
        console.error('Update error:', updateError);
        alert('Failed to update story with new image');
        return;
      }
      onImageUpdated(publicUrl);
      onClose();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  const removeImage = async () => {
    if (!confirm('Are you sure you want to remove the current image?')) return;
    setUploading(true);
    try {
      const userManager = UserContextManager.getInstance();
      const userContext = userManager.getUserContext();
      const { error: updateError } = await supabase
        .from('stories')
        .update({ 
          image_url: null,
          last_updated: new Date().toISOString()
        })
        .eq('id', storyId)
        .eq('author_user_id', userContext.userId);
      if (updateError) {
        console.error('Update error:', updateError);
        alert('Failed to remove image');
        return;
      }
      onImageUpdated(null);
      onClose();
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Failed to remove image');
    } finally {
      setUploading(false);
    }
  };
  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-rose-600" />
              Story Cover Image
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {currentImageUrl && !selectedFile && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Current Image</h3>
              <div className="relative">
                <img 
                  src={currentImageUrl} 
                  alt="Current story cover"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
                <button
                  onClick={removeImage}
                  disabled={uploading}
                  className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentImageUrl && !selectedFile ? 'Upload New Image' : 'Upload Image'}
            </h3>
            {previewUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview:</p>
                <img 
                  src={previewUrl} 
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
            )}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-rose-300 dark:hover:border-rose-300 transition-colors"
            >
              <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {selectedFile && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                    }}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              Image Guidelines
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Recommended size: 768x512 pixels (3:2 aspect ratio)</li>
              <li>• Maximum file size: 5MB</li>
              <li>• Supported formats: PNG, JPG, GIF</li>
              <li>• Images should be appropriate for all audiences</li>
            </ul>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-xl">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={uploadImage}
              disabled={!selectedFile || uploading}
              className="flex items-center gap-2 bg-rose-300 hover:bg-rose-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-rose-800 disabled:text-gray-500 px-6 py-2 rounded-full font-medium transition-colors"
            >
              <Save className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}