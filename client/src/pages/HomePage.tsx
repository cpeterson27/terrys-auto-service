import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, Image, LayoutDashboard, Mail, Pencil, PlayCircle, ShieldCheck, Wrench, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface GalleryItem {
  _id: string;
  title: string;
  description?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  category?: string;
}

interface GalleryGroup {
  category: string;
  items: GalleryItem[];
}

interface PublicAvailability {
  serviceTimes: string[];
  bookableDays: number[];
  serviceStartTime: string;
  serviceEndTime: string;
  businessPhone?: string;
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
      items: groupItems,
    }));
};

const services = [
  'Diagnostics and repair',
  'Brake service',
  'Oil changes and maintenance',
  'Suspension and steering',
  'Customer vehicle inspections',
];

const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const formatTimeOption = (time: string) => {
  const [hoursValue, minutes] = time.split(':').map(Number);
  const period = hoursValue >= 12 ? 'PM' : 'AM';
  const hours = hoursValue % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
};

const trustPoints = [
  {
    title: 'Straight answers',
    description: 'Clear explanations before work begins, with practical guidance on what needs attention.',
    icon: <ShieldCheck size={24} />,
  },
  {
    title: 'Practical repairs',
    description: 'Focused service for everyday vehicles, maintenance needs, and repair jobs done with care.',
    icon: <Wrench size={24} />,
  },
  {
    title: 'Appointment based',
    description: 'Service requests are reviewed before they are added to the schedule.',
    icon: <Clock size={24} />,
  },
];

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const [items, setItems] = React.useState<GalleryItem[]>([]);
  const [selectedWork, setSelectedWork] = React.useState<GalleryItem | null>(null);
  const [availability, setAvailability] = React.useState<PublicAvailability | null>(null);
  const [contactForm, setContactForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    company: '',
  });
  const [contactMessage, setContactMessage] = React.useState('');
  const [contactError, setContactError] = React.useState('');
  const [contactLoading, setContactLoading] = React.useState(false);

  React.useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [galleryResponse, availabilityResponse] = await Promise.all([
          api.get('/gallery/public'),
          api.get('/settings/public-availability'),
        ]);
        setItems(galleryResponse.data?.items || []);
        setAvailability(availabilityResponse.data || null);
      } catch {
        setItems([]);
      }
    };

    loadHomeData();
  }, []);

  const galleryGroups = React.useMemo(() => groupGalleryItems(items), [items]);
  const hoursText = React.useMemo(() => {
    if (!availability) {
      return '';
    }

    const days = availability.bookableDays
      .map((day) => dayLabels[day])
      .filter(Boolean);
    const compactDays = days.length === 5 && availability.bookableDays.every((day) => [1, 2, 3, 4, 5].includes(day))
      ? 'Monday-Friday'
      : days.join(', ');

    return `${compactDays}: ${formatTimeOption(availability.serviceStartTime)}-${formatTimeOption(availability.serviceEndTime)}`;
  }, [availability]);

  const primaryAction = user?.role === 'admin'
    ? { to: '/dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard size={20} /> }
    : user
      ? { to: '/bookings', label: 'Book an Appointment', icon: <Calendar size={20} /> }
      : { to: '/login', label: 'Book an Appointment', icon: <Calendar size={20} /> };

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    setContactMessage('');
    setContactLoading(true);

    try {
      await api.post('/contact', contactForm);
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '', company: '' });
      setContactMessage('Thanks. Your message has been sent.');
    } catch (err: any) {
      setContactError(err.response?.data?.error || 'Could not send your message');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <section className="bg-white">
          <div className="container mx-auto py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-blue-700 font-semibold mb-3">Local auto repair and service</p>
              <h1 className="text-5xl font-bold text-gray-950 leading-tight mb-5">
                Terry's Auto Service
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Reliable vehicle service with clear communication, practical repairs, and work Terry is proud to stand behind.
              </p>
              {(hoursText || availability?.businessPhone) && (
                <div className="mb-8 grid gap-3 text-gray-700 sm:grid-cols-2">
                  {hoursText && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-950">Available Hours</p>
                      <p className="mt-1 text-sm">{hoursText}</p>
                    </div>
                  )}
                  {availability?.businessPhone && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-950">Call Terry</p>
                      <a href={`tel:${availability.businessPhone}`} className="mt-1 block text-sm font-semibold text-blue-700">
                        {availability.businessPhone}
                      </a>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={primaryAction.to} className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700">
                  {primaryAction.icon}
                  {primaryAction.label}
                </Link>
                <a href="#work" className="inline-flex items-center justify-center gap-2 border border-gray-300 px-5 py-3 rounded-lg font-semibold text-gray-800 hover:bg-gray-50">
                  <Image size={20} />
                  View Work
                </a>
              </div>
            </div>

            <div className="bg-gray-900 text-white rounded-lg p-8 min-h-[360px]">
              <div>
                <ShieldCheck size={44} className="text-blue-300 mb-6" />
                <h2 className="text-3xl font-bold mb-4">Reliable service, clearly handled</h2>
                <p className="text-gray-300">
                  From routine maintenance to repair work, Terry keeps the process simple: explain the issue, do dependable work, and treat every vehicle with respect.
                </p>
              </div>
              <div className="space-y-4 mt-10">
                {trustPoints.map((point) => (
                  <div key={point.title} className="flex gap-4 border border-white/15 rounded-lg p-4">
                    <div className="text-blue-300 flex-shrink-0">{point.icon}</div>
                    <div>
                      <p className="font-semibold text-white">{point.title}</p>
                      <p className="text-sm text-gray-300 mt-1">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="container mx-auto py-14">
          <h2 className="text-3xl font-bold text-gray-950 mb-6">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {services.map((service) => (
              <div key={service} className="bg-white rounded-lg shadow p-5 flex gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0" size={22} />
                <p className="font-medium text-gray-800">{service}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="work" className="container mx-auto py-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-950">Featured Work</h2>
              <p className="text-gray-600 mt-2">A look at service work, repairs, and projects from Terry's shop.</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              Photos and videos from Terry's recent work will be added soon.
            </div>
          ) : (
            <div className="space-y-10">
              {galleryGroups.map((group) => (
                <section key={group.category}>
                  <h3 className="text-2xl font-bold text-gray-950 mb-4">{group.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.items.map((item) => (
                      <article key={item._id} className="overflow-hidden rounded-lg bg-white shadow transition hover:-translate-y-0.5 hover:shadow-lg">
                        <button
                          type="button"
                          onClick={() => setSelectedWork(item)}
                          className="block w-full text-left"
                        >
                          <div className="group relative aspect-video bg-gray-100">
                            {item.mediaType === 'image' ? (
                              <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover" />
                            ) : (
                              <img src={item.thumbnailUrl || item.mediaUrl} alt={item.title} className="h-full w-full object-cover" />
                            )}
                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/55 via-black/0 to-transparent opacity-100">
                              <span className="m-4 rounded bg-white/95 px-3 py-2 text-sm font-semibold text-gray-950 shadow">
                                View Details
                              </span>
                            </div>
                          </div>
                        </button>
                        <div className="p-5">
                          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">{getCategory(item.category)}</p>
                          <h4 className="font-bold text-lg text-gray-950">{item.title}</h4>
                          {item.description && <p className="text-gray-600 mt-2">{item.description}</p>}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <section id="contact" className="container mx-auto py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-blue-700 font-semibold mb-3">Contact</p>
              <h2 className="text-3xl font-bold text-gray-950 mb-4">Ask about service</h2>
              <p className="text-gray-600 text-lg">
                Send a quick message about your vehicle, the service you need, or a question before booking.
              </p>
              <div className="mt-6 bg-white rounded-lg shadow p-5 flex gap-3">
                <Mail className="text-blue-600 flex-shrink-0" size={24} />
                <div>
                  <p className="font-semibold text-gray-950">Private by default</p>
                  <p className="text-gray-600 mt-1">
                    This form keeps Terry's direct contact details off the public page and helps reduce spam.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={submitContact} className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactError && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {contactError}
                </div>
              )}
              {contactMessage && (
                <div className="md:col-span-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {contactMessage}
                </div>
              )}
              <input
                value={contactForm.company}
                onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={contactLoading}
                className="md:col-span-2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {contactLoading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </section>
      </main>

      {selectedWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="max-h-full w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">{getCategory(selectedWork.category)}</p>
                <h2 className="text-2xl font-bold text-gray-950">{selectedWork.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWork(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close work details"
              >
                <X size={22} />
              </button>
            </div>
            <div className="grid max-h-[calc(100vh-9rem)] grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <div className="bg-gray-950">
                {selectedWork.mediaType === 'image' ? (
                  <img src={selectedWork.mediaUrl} alt={selectedWork.title} className="max-h-[72vh] w-full object-contain" />
                ) : (
                  <video src={selectedWork.mediaUrl} poster={selectedWork.thumbnailUrl} controls className="max-h-[72vh] w-full bg-black" />
                )}
              </div>
              <div className="p-6">
                <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-700">{getCategory(selectedWork.category)}</p>
                <h3 className="text-xl font-bold text-gray-950">{selectedWork.title}</h3>
                <p className="mt-3 text-gray-600">
                  {selectedWork.description || 'Service work from Terry\'s shop.'}
                </p>
                <Link
                  to={user?.role === 'admin' ? `/gallery?edit=${selectedWork._id}` : primaryAction.to}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  {user?.role === 'admin' ? <Pencil size={18} /> : <Calendar size={18} />}
                  {user?.role === 'admin' ? 'Edit in Gallery' : primaryAction.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
