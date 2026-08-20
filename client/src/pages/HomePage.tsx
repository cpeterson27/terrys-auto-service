import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Calendar, Car, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, Gauge, Image, LayoutDashboard, MapPin, Medal, MessageCircle, Pencil, Search, ShieldCheck, Wrench, X } from 'lucide-react';
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
const processSteps=[
  {number:'01',title:'Tell Terry what is going on',description:'Send the vehicle details, symptoms, and the best way to reach you through the service request form.',icon:ClipboardCheck},
  {number:'02',title:'Terry reviews the request',description:'Your request is reviewed before anything is placed on the schedule so the next step is clear.',icon:Search},
  {number:'03',title:'Confirm the appointment',description:'Terry follows up directly to discuss the vehicle and confirm an available service time.',icon:Calendar},
];
const detailedServices=[
  {title:'Diagnostics & warning lights',description:'For check-engine lights, drivability concerns, unusual sounds, or a vehicle that simply does not feel right.',icon:Gauge},
  {title:'Brake service',description:'Inspection and repair for squealing, grinding, vibration, soft pedals, and worn braking components.',icon:ShieldCheck},
  {title:'Oil changes & maintenance',description:'Routine service that helps protect your engine and keeps everyday wear from becoming a larger problem.',icon:Clock3},
  {title:'Suspension & steering',description:'Help with pulling, uneven tire wear, looseness, clunks, vibration, and changes in ride quality.',icon:Car},
  {title:'Vehicle inspections',description:'A practical look at the vehicle when you need help understanding its condition or prioritizing repairs.',icon:ClipboardCheck},
  {title:'General mechanical repair',description:'Focused repair work for common mechanical issues on everyday passenger vehicles.',icon:Wrench},
];
const symptoms=['A warning light is on','Brakes squeal, grind, or vibrate','The vehicle pulls or feels loose','You notice a leak or unusual smell','A new noise started recently','Routine maintenance is overdue'];
const faqs=[
  {question:'Do I need an appointment?',answer:'Yes. Terry works by appointment so each request can be reviewed and a suitable service time can be confirmed before you arrive.'},
  {question:'How do I request service?',answer:'Use the form below and include your vehicle information, what you are noticing, and your contact details. Terry will review the request and follow up directly.'},
  {question:'Is submitting a request the same as booking?',answer:'No. A website request starts the conversation. The appointment is added to the schedule after Terry reviews the details and confirms the timing with you.'},
  {question:'What information should I include?',answer:'Include the year, make, and model when possible, along with warning lights, noises, leaks, recent repairs, or anything else that may help explain the concern.'},
  {question:'What if I am not sure what service I need?',answer:'That is completely fine. Describe what the vehicle is doing in plain language. Terry can review the symptoms and help determine the practical next step.'},
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

      <section className="process-section home-content-section">
        <div className="container"><div className="section-heading"><p>Simple from the start</p><h2>How service works</h2><span>No guessing and no automatic appointment you were not expecting. Every request starts with a direct review.</span></div>
          <div className="process-grid">{processSteps.map(({number,title,description,icon:Icon})=><article className="process-card" key={number}><div className="process-card-top"><span>{number}</span><Icon size={25}/></div><h3>{title}</h3><p>{description}</p></article>)}</div>
        </div>
      </section>

      <section className="service-detail-section home-content-section">
        <div className="container"><div className="section-heading light"><p>Repair & maintenance</p><h2>Help for the problems drivers actually notice</h2><span>Start with the concern, not the technical name. Terry can review the details and help narrow down what the vehicle needs.</span></div>
          <div className="service-detail-grid">{detailedServices.map(({title,description,icon:Icon})=><article key={title}><div><Icon size={24}/></div><h3>{title}</h3><p>{description}</p></article>)}</div>
        </div>
      </section>

      <section className="symptom-section">
        <div className="container symptom-layout"><div><p className="section-kicker">Not sure where to start?</p><h2>You do not need to diagnose it yourself</h2><p>Tell Terry what changed, when it started, and what you see, hear, smell, or feel while driving. Those details are useful.</p><a href="#contact">Describe the problem <MessageCircle size={17}/></a></div>
          <div className="symptom-list">{symptoms.map(symptom=><div key={symptom}><CheckCircle2 size={18}/><span>{symptom}</span></div>)}</div></div>
      </section>

      <section id="work" className="work-section home-section">
        <div className="container"><p className="home-section-label">Recent work</p><h2 className="home-section-title">Built on experience</h2>
          <div className="reference-grid">{referenceWork.map(([src,label])=><div className="reference-card" key={src}><img src={src} alt={label}/><span>{label}</span></div>)}</div>
          {items.length>0&&<div className="live-work-grid">{items.slice(0,6).map(item=><button type="button" className="live-work-card text-left" key={item._id} onClick={()=>{setSelectedWork(item);setSelectedMediaIndex(0);}}>
            <div className="live-work-media"><img src={item.thumbnailUrl||item.mediaUrl} alt={item.title}/></div><div className="live-work-body"><small>{getCategory(item.category)}</small><h3>{item.title}</h3></div>
          </button>)}</div>}
        </div>
      </section>

      <section className="about-section home-content-section">
        <div className="container about-layout"><div className="about-visual"><img src="/mechanic-working-reference.png" alt="Mechanic working carefully on a vehicle"/><div><AlertTriangle size={24}/><strong>Appointment based</strong><span>Requests are reviewed before they are scheduled.</span></div></div>
          <div className="about-copy"><p className="section-kicker">A direct approach to auto repair</p><h2>Work with the person reviewing your vehicle</h2><p>Terry's Auto Service is built around straightforward communication and practical repair decisions. Terry reviews the service requests himself, follows up directly, and keeps the focus on what the vehicle needs.</p><p>The appointment-based process gives each request a clear starting point and helps customers understand the next step before their vehicle is added to the schedule.</p><div className="about-values"><span><ShieldCheck size={19}/>Clear explanations</span><span><Wrench size={19}/>Practical repair decisions</span><span><MessageCircle size={19}/>Direct follow-up</span></div></div>
        </div>
      </section>

      <section className="faq-section home-content-section">
        <div className="container faq-layout"><div><p className="section-kicker">Before you request service</p><h2>Common questions</h2><p>Here is what to expect from Terry's appointment-based process.</p></div><div className="faq-list">{faqs.map((faq,index)=><details key={faq.question} open={index===0}><summary>{faq.question}<ChevronDown size={19}/></summary><p>{faq.answer}</p></details>)}</div></div>
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
      <section className="closing-cta"><div className="container"><div><p>Not sure what the vehicle needs?</p><h2>Start with what you are noticing.</h2><span>Terry will review the details and help determine the next practical step.</span></div><a href="#contact"><MessageCircle size={18}/>Request service</a></div></section>
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
