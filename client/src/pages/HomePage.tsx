import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock3, Gauge, Image, LayoutDashboard, MapPin, Medal, MessageCircle, Pencil, ShieldCheck, Wrench, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface GalleryMedia { mediaType:'image'|'video'; mediaUrl:string; thumbnailUrl?:string; }
interface GalleryItem extends GalleryMedia { _id:string; title:string; description?:string; additionalMedia?:GalleryMedia[]; category?:string; }
interface PublicAvailability { bookableDays:number[]; serviceStartTime:string; serviceEndTime:string; businessPhone?:string; }

const dayLabels=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const referenceWork=[
  ['/brake-repair-reference.png','Brake service'], ['/engine-bay-reference.png','Diagnostics'],
  ['/mechanic-working-reference.png','Repairs'], ['/suspension-repair-reference.png','Suspension'], ['/oil-service-reference.png','Maintenance'],
] as const;
const services=[
  { title:'Diagnostics', text:'Accurate diagnosis to get to the root of the problem.', icon:Gauge },
  { title:'Repairs', text:'Quality repairs done right the first time.', icon:Wrench },
  { title:'Maintenance', text:'Preventive service to keep you on the road.', icon:Clock3 },
  { title:'Reliable service', text:'Honest work you can count on, every time.', icon:ShieldCheck },
];
const trustPoints=[
  {title:'Straight answers',description:'Clear explanations before work begins, with practical guidance on what needs attention.',icon:ShieldCheck},
  {title:'Practical repairs',description:'Focused service for everyday vehicles, maintenance needs, and repair jobs done with care.',icon:Wrench},
  {title:'Appointment based',description:'Service requests are reviewed before they are added to the schedule.',icon:Clock3},
];
const getCategory=(category?:string)=>category?.trim()||'Auto service';
const formatTime=(value:string)=>{ const [h,m]=value.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; };

const HomePage:React.FC=()=>{
  const {user}=useAuthStore();
  const [items,setItems]=React.useState<GalleryItem[]>([]);
  const [availability,setAvailability]=React.useState<PublicAvailability|null>(null);
  const [selectedWork,setSelectedWork]=React.useState<GalleryItem|null>(null);
  const [selectedMediaIndex,setSelectedMediaIndex]=React.useState(0);
  const [contactForm,setContactForm]=React.useState({name:'',email:'',phone:'',subject:'',message:'',company:''});
  const [contactMessage,setContactMessage]=React.useState('');
  const [contactError,setContactError]=React.useState('');
  const [contactLoading,setContactLoading]=React.useState(false);

  React.useEffect(()=>{ void Promise.all([api.get('/gallery/public'),api.get('/settings/public-availability')]).then(([gallery,hours])=>{
    setItems(gallery.data?.items||[]); setAvailability(hours.data||null);
  }).catch(()=>setItems([])); },[]);

  React.useEffect(()=>{
    if(!selectedWork)return;
    const close=(event:KeyboardEvent)=>{ if(event.key==='Escape')setSelectedWork(null); };
    window.addEventListener('keydown',close); return()=>window.removeEventListener('keydown',close);
  },[selectedWork]);

  const hoursText=React.useMemo(()=>{
    if(!availability)return 'Monday–Friday · 8:00 AM–5:00 PM';
    const days=availability.bookableDays.map(day=>dayLabels[day]).filter(Boolean);
    const dayText=days.length===5&&availability.bookableDays.every(day=>[1,2,3,4,5].includes(day))?'Monday–Friday':days.join(', ');
    return `${dayText} · ${formatTime(availability.serviceStartTime)}–${formatTime(availability.serviceEndTime)}`;
  },[availability]);
  const primaryAction=user?.role==='admin'?{to:'/dashboard',label:'Go to dashboard',icon:LayoutDashboard}:user?{to:'/bookings',label:'Request service',icon:Calendar}:{to:'/login',label:'Request service',icon:Calendar};
  const PrimaryIcon=primaryAction.icon;
  const selectedMedia=selectedWork?[{mediaType:selectedWork.mediaType,mediaUrl:selectedWork.mediaUrl,thumbnailUrl:selectedWork.thumbnailUrl},...(selectedWork.additionalMedia||[])][selectedMediaIndex]:null;

  const submitContact=async(event:React.FormEvent)=>{
    event.preventDefault(); setContactError(''); setContactMessage(''); setContactLoading(true);
    try { await api.post('/contact',contactForm); setContactForm({name:'',email:'',phone:'',subject:'',message:'',company:''}); setContactMessage('Thanks—your message has been sent to Terry.'); }
    catch(error:any){ setContactError(error.response?.data?.error||'Could not send your message.'); }
    finally { setContactLoading(false); }
  };

  return <div className="home-page">
    <main>
      <section className="home-hero">
        <img className="home-hero-bg" src="/terrys-hero-garage-reference.png" alt="Black performance car in Terry's workshop" />
        <div className="container home-hero-grid">
          <div>
            <div className="eyebrow">Independent auto mechanic</div>
            <h1 className="hero-title">Honest repair work<br/>for <span>everyday</span> drivers</h1>
            <p className="hero-copy">Terry handles appointment-based repair and maintenance with straight answers, practical next steps, and work he is willing to stand behind.</p>
            <div className="hero-hours"><Clock3 size={25}/><div><strong>Available hours</strong><span>{hoursText}</span></div></div>
            <div className="hero-actions">
              <Link to={primaryAction.to} className="hero-primary"><PrimaryIcon size={18}/>{primaryAction.label}</Link>
              <a href="#work" className="hero-secondary"><Image size={18}/>View work</a>
            </div>
          </div>
          <aside className="expect-card">
            <ShieldCheck size={41}/><h2>What to expect</h2>
            <p>Terry reviews service requests before adding them to the schedule, then follows up with practical next steps for your vehicle.</p>
            <div className="expect-list">{trustPoints.map(({title,description,icon:Icon})=><div className="expect-item" key={title}><Icon size={23}/><div><strong>{title}</strong><p>{description}</p></div></div>)}</div>
          </aside>
        </div>
      </section>

      <section id="services" className="services-band home-section">
        <div className="container"><p className="home-section-label">Service you can count on</p><h2 className="home-section-title">Focused on what matters</h2>
          <div className="service-grid">{services.map(({title,text,icon:Icon})=><article className="service-item" key={title}><Icon size={31}/><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section id="work" className="work-section home-section">
        <div className="container"><p className="home-section-label">Recent work</p><h2 className="home-section-title">Built on experience</h2>
          <div className="reference-grid">{referenceWork.map(([src,label])=><div className="reference-card" key={src}><img src={src} alt={label}/><span>{label}</span></div>)}</div>
          {items.length>0&&<div className="live-work-grid">{items.slice(0,6).map(item=><button type="button" className="live-work-card text-left" key={item._id} onClick={()=>{setSelectedWork(item);setSelectedMediaIndex(0);}}>
            <div className="live-work-media"><img src={item.thumbnailUrl||item.mediaUrl} alt={item.title}/></div><div className="live-work-body"><small>{getCategory(item.category)}</small><h3>{item.title}</h3></div>
          </button>)}</div>}
        </div>
      </section>

      <section id="contact" className="contact-section home-section">
        <div className="container contact-layout"><div><p className="home-section-label">Have a question?</p><h2 className="home-section-title">Tell Terry what your vehicle needs</h2><p className="contact-copy">Send the vehicle details, what you are noticing, and the best way to reach you. Terry will review it and follow up directly.</p>
          <div className="mt-7 space-y-4 text-sm font-semibold text-gray-700"><p className="flex items-center gap-3"><MessageCircle className="text-red-600"/>Straight answers, no pressure</p><p className="flex items-center gap-3"><Medal className="text-red-600"/>Work backed by experience</p><p className="flex items-center gap-3"><MapPin className="text-red-600"/>Local and reliable</p></div>
        </div>
          <form className="contact-form" onSubmit={submitContact}>
            {contactError&&<div className="field-full rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{contactError}</div>}{contactMessage&&<div className="field-full rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{contactMessage}</div>}
            <input className="hidden" tabIndex={-1} autoComplete="off" value={contactForm.company} onChange={e=>setContactForm({...contactForm,company:e.target.value})}/>
            <div className="field"><label htmlFor="contact-name">Name</label><input id="contact-name" required value={contactForm.name} onChange={e=>setContactForm({...contactForm,name:e.target.value})}/></div>
            <div className="field"><label htmlFor="contact-email">Email</label><input id="contact-email" type="email" required value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})}/></div>
            <div className="field"><label htmlFor="contact-phone">Phone</label><input id="contact-phone" type="tel" value={contactForm.phone} onChange={e=>setContactForm({...contactForm,phone:e.target.value})}/></div>
            <div className="field"><label htmlFor="contact-subject">Subject</label><input id="contact-subject" required value={contactForm.subject} onChange={e=>setContactForm({...contactForm,subject:e.target.value})}/></div>
            <div className="field field-full"><label htmlFor="contact-message">What can Terry help with?</label><textarea id="contact-message" rows={5} required value={contactForm.message} onChange={e=>setContactForm({...contactForm,message:e.target.value})}/></div>
            <button className="contact-submit" type="submit" disabled={contactLoading}>{contactLoading?'Sending…':'Send message'}</button>
          </form>
        </div>
      </section>
    </main>

    {selectedWork&&<div className="work-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="work-title" onMouseDown={event=>{if(event.currentTarget===event.target)setSelectedWork(null);}}>
      <div className="work-modal">
        <header className="work-modal-header"><div><span>Shop work</span><strong>Terry's Auto Service</strong></div><button type="button" onClick={()=>setSelectedWork(null)} aria-label="Close work details"><X size={21}/></button></header>
        <div className="work-modal-main">
          <div className="work-media-stage">{selectedMedia?.mediaType==='video'?<video src={selectedMedia.mediaUrl} poster={selectedMedia.thumbnailUrl} controls/>:<img src={selectedMedia?.mediaUrl} alt={selectedWork.title}/>}<span className="work-media-count">{selectedMediaIndex+1} / {(selectedWork.additionalMedia?.length||0)+1}</span></div>
          <aside className="work-modal-details">
            <div><p className="work-modal-kicker">{getCategory(selectedWork.category)}</p><h2 id="work-title">{selectedWork.title}</h2><div className="work-title-rule"/><p className="work-description">{selectedWork.description||"A closer look at service work completed by Terry's Auto Service."}</p></div>
            <div className="work-detail-note"><ShieldCheck size={20}/><div><strong>Work you can count on</strong><span>Practical repairs, clear communication, and attention to the details that matter.</span></div></div>
            <Link to={user?.role==='admin'?`/gallery?edit=${selectedWork._id}`:primaryAction.to} className="work-modal-action">{user?.role==='admin'?<Pencil size={17}/>:<Calendar size={17}/>} {user?.role==='admin'?'Edit gallery entry':primaryAction.label}</Link>
          </aside>
        </div>
        {(selectedWork.additionalMedia?.length||0)>0&&<footer className="work-thumbnail-rail"><span>More from this job</span><div>{[{mediaType:selectedWork.mediaType,mediaUrl:selectedWork.mediaUrl,thumbnailUrl:selectedWork.thumbnailUrl},...(selectedWork.additionalMedia||[])].map((media,index)=><button key={`${media.mediaUrl}-${index}`} type="button" onClick={()=>setSelectedMediaIndex(index)} className={selectedMediaIndex===index?'active':''} aria-label={`View image ${index+1}`}><img src={media.thumbnailUrl||media.mediaUrl} alt=""/></button>)}</div></footer>}
      </div>
    </div>}
  </div>;
};

export default HomePage;
