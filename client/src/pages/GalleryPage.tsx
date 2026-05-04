import React from 'react';
import { Image, Plus, Trash2, Upload, Video } from 'lucide-react';
import { api } from '../lib/api';

interface GalleryItem {
  _id: string;
  title: string;
  description?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  category?: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
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
  const [items, setItems] = React.useState<GalleryItem[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    mediaFile: null as File | null,
    category: 'Auto Service',
    sortOrder: '0',
    published: true,
    featured: true,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('category', form.category);
      payload.append('sortOrder', form.sortOrder);
      payload.append('published', String(form.published));
      payload.append('featured', String(form.featured));

      if (form.mediaFile) {
        payload.append('media', form.mediaFile);
      }

      await api.post('/gallery', payload);
      setForm({
        title: '',
        description: '',
        mediaFile: null,
        category: 'Auto Service',
        sortOrder: '0',
        published: true,
        featured: true,
      });
      setShowForm(false);
      await loadItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save gallery item');
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (id: string, updates: Partial<GalleryItem>) => {
    try {
      await api.patch(`/gallery/${id}`, updates);
      await loadItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update gallery item');
    }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm('Delete this gallery item?')) {
      return;
    }

    try {
      await api.delete(`/gallery/${id}`);
      await loadItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not delete gallery item');
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
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo or Video</label>
            <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:bg-gray-100">
              <Upload className="mb-3 text-blue-600" size={28} />
              <span className="font-medium text-gray-900">
                {form.mediaFile ? form.mediaFile.name : 'Choose a file to upload'}
              </span>
              <span className="mt-1 text-sm text-gray-500">Images and videos upload directly to Cloudinary.</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setForm({ ...form, mediaFile: e.target.files?.[0] || null })}
                className="hidden"
                required
              />
            </label>
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
          <button type="submit" disabled={saving} className="md:col-span-2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Uploading...' : 'Save Media'}
          </button>
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
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Category
                          <input
                            defaultValue={getCategory(item.category)}
                            onBlur={(event) => updateItem(item._id, { category: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                          />
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                          Order
                          <input
                            type="number"
                            defaultValue={item.sortOrder}
                            onBlur={(event) => updateItem(item._id, { sortOrder: Number(event.target.value) || 0 })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                          />
                        </label>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <button
                          onClick={() => updateItem(item._id, { published: !item.published })}
                          className={item.published ? 'text-green-700 font-medium' : 'text-gray-500 font-medium'}
                        >
                          {item.published ? 'Published' : 'Hidden'}
                        </button>
                        <button onClick={() => deleteItem(item._id)} className="text-red-600 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
