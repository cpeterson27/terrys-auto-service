import React from 'react';
import { AlertTriangle, Image, Pencil, Plus, Trash2, Upload, Video, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

interface GalleryItem {
  _id: string;
  title: string;
  description?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  additionalMedia?: GalleryMedia[];
  category?: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
}

interface GalleryMedia {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  cloudinaryPublicId?: string;
}

interface GalleryGroup {
  category: string;
  items: GalleryItem[];
}

const getCategory = (category?: string) => category?.trim() || 'Auto Service';

const groupGalleryItems = (galleryItems: GalleryItem[]): GalleryGroup[] => {
  const groups = new Map<string, GalleryItem[]>();

  galleryItems.forEach((item) => {
    const category = getCategory(item.category);
    groups.set(category, [...(groups.get(category) || []), item]);
  });

  return Array.from(groups.entries())
    .sort(([firstCategory], [secondCategory]) => firstCategory.localeCompare(secondCategory))
    .map(([category, groupItems]) => ({
      category,
      items: [...groupItems].sort((firstItem, secondItem) => {
        if (firstItem.sortOrder !== secondItem.sortOrder) {
          return firstItem.sortOrder - secondItem.sortOrder;
        }

        return firstItem.title.localeCompare(secondItem.title);
      }),
    }));
};

const GalleryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = React.useState<GalleryItem[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<GalleryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<GalleryItem | null>(null);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [addingMedia, setAddingMedia] = React.useState(false);
  const [isDraggingFile, setIsDraggingFile] = React.useState(false);
  const [isDraggingAdditionalMedia, setIsDraggingAdditionalMedia] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const additionalMediaInputRef = React.useRef<HTMLInputElement | null>(null);
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    mediaFiles: [] as File[],
    category: 'Auto Service',
    sortOrder: '0',
    published: true,
    featured: true,
  });
  const [mediaPreviewUrls, setMediaPreviewUrls] = React.useState<string[]>([]);
  const [editForm, setEditForm] = React.useState({
    title: '',
    description: '',
    category: 'Auto Service',
    sortOrder: '0',
    published: true,
    featured: true,
  });
  const [additionalFiles, setAdditionalFiles] = React.useState<File[]>([]);
  const [additionalPreviewUrls, setAdditionalPreviewUrls] = React.useState<string[]>([]);

  const loadItems = React.useCallback(async () => {
    try {
      const response = await api.get('/gallery');
      setItems(response.data.items);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load gallery');
    }
  }, []);

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  const galleryGroups = React.useMemo(() => groupGalleryItems(items), [items]);

  React.useEffect(() => {
    if (form.mediaFiles.length === 0) {
      setMediaPreviewUrls([]);
      return;
    }

    const previewUrls = form.mediaFiles.map((file) => URL.createObjectURL(file));
    setMediaPreviewUrls(previewUrls);

    return () => previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
  }, [form.mediaFiles]);

  React.useEffect(() => {
    if (additionalFiles.length === 0) {
      setAdditionalPreviewUrls([]);
      return;
    }

    const previewUrls = additionalFiles.map((file) => URL.createObjectURL(file));
    setAdditionalPreviewUrls(previewUrls);

    return () => previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
  }, [additionalFiles]);

  React.useEffect(() => {
    const itemToEdit = searchParams.get('edit');

    if (!itemToEdit || items.length === 0) {
      return;
    }

    const matchedItem = items.find((item) => item._id === itemToEdit);

    if (matchedItem) {
      openEditModal(matchedItem);
      setSearchParams({}, { replace: true });
    }
  }, [items, searchParams, setSearchParams]);

  const resetUploadForm = () => {
    setForm({
      title: '',
      description: '',
      mediaFiles: [],
      category: 'Auto Service',
      sortOrder: '0',
      published: true,
      featured: true,
    });
    setIsDraggingFile(false);
    setShowForm(false);
    setError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.mediaFiles.length === 0) {
      setError('Choose or drop at least one photo or video before saving');
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('category', form.category);
      payload.append('sortOrder', form.sortOrder);
      payload.append('published', String(form.published));
      payload.append('featured', String(form.featured));

      form.mediaFiles.forEach((file) => payload.append('media', file));

      await api.post('/gallery', payload);
      resetUploadForm();
      await loadItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save gallery item');
    } finally {
      setSaving(false);
    }
  };

  const setMediaFiles = (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);

    if (selectedFiles.length === 0) {
      return;
    }

    const invalidFile = selectedFiles.find((file) => !file.type.startsWith('image/') && !file.type.startsWith('video/'));

    if (invalidFile) {
      setError('Only image and video files can be uploaded');
      return;
    }

    setError('');
    setForm((currentForm) => ({ ...currentForm, mediaFiles: selectedFiles }));
  };

  const setMoreMediaFiles = (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);

    if (selectedFiles.length === 0) {
      return;
    }

    const invalidFile = selectedFiles.find((file) => !file.type.startsWith('image/') && !file.type.startsWith('video/'));

    if (invalidFile) {
      setError('Only image and video files can be uploaded');
      return;
    }

    setError('');
    setAdditionalFiles(selectedFiles);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    setMediaFiles(event.dataTransfer.files);
  };

  const handleAdditionalMediaDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingAdditionalMedia(false);
    setMoreMediaFiles(event.dataTransfer.files);
  };

  const updateItem = async (id: string, updates: Partial<GalleryItem>) => {
    try {
      await api.patch(`/gallery/${id}`, updates);
      await loadItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update gallery item');
    }
  };

  const openEditModal = (item: GalleryItem) => {
    setError('');
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      category: getCategory(item.category),
      sortOrder: String(item.sortOrder || 0),
      published: item.published,
      featured: item.featured,
    });
    setAdditionalFiles([]);
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingItem) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.patch(`/gallery/${editingItem._id}`, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        sortOrder: Number(editForm.sortOrder) || 0,
        published: editForm.published,
        featured: editForm.featured,
      });
      setEditingItem(null);
      await loadItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update gallery item');
    } finally {
      setSaving(false);
    }
  };

  const addMediaToItem = async () => {
    if (!editingItem || additionalFiles.length === 0) {
      return;
    }

    setAddingMedia(true);
    setError('');

    try {
      const payload = new FormData();
      additionalFiles.forEach((file) => payload.append('media', file));
      const response = await api.post(`/gallery/${editingItem._id}/media`, payload);
      setEditingItem(response.data.item);
      setAdditionalFiles([]);

      if (additionalMediaInputRef.current) {
        additionalMediaInputRef.current.value = '';
      }

      await loadItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not add media to this gallery item');
    } finally {
      setAddingMedia(false);
    }
  };

  const deleteItem = async () => {
    if (!deleteTarget) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.delete(`/gallery/${deleteTarget._id}`);
      setDeleteTarget(null);
      await loadItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not delete gallery item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-600 mt-2">Manage the photos and videos shown on Terry's homepage.</p>
        </div>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Add Media</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Optional for batch uploads" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photos or Videos</label>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDrop}
              className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed text-center transition ${
                isDraggingFile
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {form.mediaFiles.length > 0 && mediaPreviewUrls.length > 0 ? (
                <div className="w-full p-4">
                  <div className="mb-4 flex flex-col gap-1 text-left sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Preview</p>
                      <p className="text-sm text-gray-600">
                        {form.mediaFiles.length} file{form.mediaFiles.length === 1 ? '' : 's'} selected. These will publish in {form.category || 'Auto Service'}.
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">Click or drop again to replace the selection.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {form.mediaFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm">
                        <div className="aspect-video bg-gray-950">
                          {file.type.startsWith('video/') ? (
                            <video src={mediaPreviewUrls[index]} controls className="h-full w-full object-contain" />
                          ) : (
                            <img src={mediaPreviewUrls[index]} alt={`Selected upload preview ${index + 1}`} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="truncate font-semibold text-gray-950">
                            {form.title ? `${form.title}${form.mediaFiles.length > 1 ? ` ${index + 1}` : ''}` : file.name.replace(/\.[^/.]+$/, '')}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{form.category || 'Auto Service'}</p>
                          {form.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{form.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-8">
                  <Upload className="mx-auto mb-3 text-blue-600" size={28} />
                  <span className="font-medium text-gray-900">Drop files here or click to choose</span>
                  <span className="mt-1 block text-sm text-gray-500">Select one photo, one video, or a full batch at once.</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                name="media"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => e.target.files && setMediaFiles(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Repairs, Brakes, Before and After" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order in Category</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} />
          </div>
          <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetUploadForm}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Uploading...' : `Save ${form.mediaFiles.length > 1 ? `${form.mediaFiles.length} Items` : 'Media'}`}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          No gallery media yet. Add Terry's first photo or video from this dashboard.
        </div>
      ) : (
        <div className="space-y-10">
          {galleryGroups.map((group) => (
            <section key={group.category}>
              <div className="mb-4 flex items-end justify-between gap-4 border-b border-gray-200 pb-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{group.category}</h2>
                  <p className="text-sm text-gray-600">{group.items.length} media item{group.items.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((item) => (
                  <article key={item._id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="aspect-video bg-gray-100">
                      {item.mediaType === 'image' ? (
                        <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.mediaUrl} poster={item.thumbnailUrl} controls className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        {item.mediaType === 'image' ? <Image size={16} /> : <Video size={16} />}
                        <span>{getCategory(item.category)}</span>
                      </div>
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      {item.description && <p className="text-gray-600 mt-2">{item.description}</p>}
                      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-600">
                        <span>Order {item.sortOrder || 0}</span>
                        <span>{(item.additionalMedia?.length || 0) + 1} media item{(item.additionalMedia?.length || 0) === 0 ? '' : 's'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t">
                        <button
                          onClick={() => updateItem(item._id, { published: !item.published })}
                          className={item.published ? 'text-green-700 font-medium' : 'text-gray-500 font-medium'}
                        >
                          {item.published ? 'Published' : 'Hidden'}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form onSubmit={saveEdit} className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Media</h2>
                <p className="mt-1 text-sm text-gray-600">Update how this item appears in Terry's public gallery.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close edit media"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  value={editForm.title}
                  onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  value={editForm.category}
                  onChange={(event) => setEditForm({ ...editForm, category: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order in Category</label>
                <input
                  type="number"
                  value={editForm.sortOrder}
                  onChange={(event) => setEditForm({ ...editForm, sortOrder: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={4}
                />
              </div>
              <div className="md:col-span-2 rounded-lg border border-gray-200 p-4">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold text-gray-950">Media for this job</h3>
                    <p className="text-sm text-gray-600">Keep multiple photos or videos together on this one gallery card.</p>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {(editingItem.additionalMedia?.length || 0) + 1} total
                  </span>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[{
                    mediaType: editingItem.mediaType,
                    mediaUrl: editingItem.mediaUrl,
                    thumbnailUrl: editingItem.thumbnailUrl,
                  }, ...(editingItem.additionalMedia || [])].map((media, index) => (
                    <div key={`${media.mediaUrl}-${index}`} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <div className="aspect-video bg-gray-950">
                        {media.mediaType === 'video' ? (
                          <video src={media.mediaUrl} poster={media.thumbnailUrl} className="h-full w-full object-cover" />
                        ) : (
                          <img src={media.mediaUrl} alt={`${editingItem.title} media ${index + 1}`} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <p className="px-2 py-1 text-xs font-medium text-gray-600">{index === 0 ? 'Main' : `Extra ${index}`}</p>
                    </div>
                  ))}
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => additionalMediaInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      additionalMediaInputRef.current?.click();
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingAdditionalMedia(true);
                  }}
                  onDragLeave={() => setIsDraggingAdditionalMedia(false)}
                  onDrop={handleAdditionalMediaDrop}
                  className={`rounded-lg border-2 border-dashed p-4 text-center ${
                    isDraggingAdditionalMedia ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <Upload className="mx-auto mb-2 text-blue-600" size={24} />
                  <p className="font-medium text-gray-900">Drop more photos/videos here or click to choose</p>
                  <input
                    ref={additionalMediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(event) => event.target.files && setMoreMediaFiles(event.target.files)}
                    className="hidden"
                  />
                </div>
                {additionalFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {additionalFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="overflow-hidden rounded-lg border border-gray-200">
                          <div className="aspect-video bg-gray-950">
                            {file.type.startsWith('video/') ? (
                              <video src={additionalPreviewUrls[index]} className="h-full w-full object-cover" />
                            ) : (
                              <img src={additionalPreviewUrls[index]} alt={`Additional media preview ${index + 1}`} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <p className="truncate px-2 py-1 text-xs text-gray-600">{file.name}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setAdditionalFiles([])}
                        className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={addMediaToItem}
                        disabled={addingMedia}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {addingMedia ? 'Adding...' : `Add ${additionalFiles.length} Media`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
                <input
                  type="checkbox"
                  checked={editForm.published}
                  onChange={(event) => setEditForm({ ...editForm, published: event.target.checked })}
                  className="h-4 w-4"
                />
                <span>
                  <span className="block font-medium text-gray-900">Published</span>
                  <span className="block text-sm text-gray-600">Show this item on the public homepage.</span>
                </span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
                <input
                  type="checkbox"
                  checked={editForm.featured}
                  onChange={(event) => setEditForm({ ...editForm, featured: event.target.checked })}
                  className="h-4 w-4"
                />
                <span>
                  <span className="block font-medium text-gray-900">Featured</span>
                  <span className="block text-sm text-gray-600">Keep this item marked as important work.</span>
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="px-6 py-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Delete Gallery Item?</h2>
              <p className="mt-2 text-gray-600">
                This will permanently remove "{deleteTarget.title}" from the dashboard and the public gallery.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep Item
              </button>
              <button
                type="button"
                onClick={deleteItem}
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
