import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Calendar, Car, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, Gauge, Image, LayoutDashboard, MessageCircle, Pencil, Search, ShieldCheck, Wrench, X } from 'lucide-react';
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
  {number:'01',title:'Tell us what is going on',description:'Send the vehicle details, symptoms, and the best way to reach you through the service request form.',icon:ClipboardCheck},
  {number:'02',title:'The request is reviewed',description:'Nothing is placed on the schedule until the details have been reviewed and the next step is clear.',icon:Search},
  {number:'03',title:'Confirm the appointment',description:'You receive a direct follow-up to discuss the vehicle and confirm an available service time.',icon:Calendar},
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
  {question:'Do I need an appointment?',answer:'Yes. The shop works by appointment so each request can be reviewed and a suitable service time can be confirmed before you arrive.'},
  {question:'How do I request service?',answer:'Open the request form, select any relevant services, add your vehicle information if available, and describe what you are noticing.'},
  {question:'Is submitting a request the same as booking?',answer:'No. A website request starts the conversation. The appointment is added to the schedule after the details and timing are confirmed with you.'},
  {question:'What information should I include?',answer:'Include the year, make, and model when possible, along with warning lights, noises, leaks, recent repairs, or anything else that may help explain the concern.'},
  {question:'What if I am not sure what service I need?',answer:'That is completely fine. Select “Not sure” and describe what the vehicle is doing in plain language so the concern can be reviewed.'},
];
const requestServices=['Diagnostics / warning light','Brake service','Oil change / maintenance','Suspension / steering','Vehicle inspection','General mechanical repair','Not sure — describe the issue'];
const getCategory=(category?:string)=>category?.trim()||'Auto service';
const formatTime=(value:string)=>{ const [h,m]=value.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; };

const HomePage:React.FC=()=>{
  const {user}=useAuthStore();
  const [items,setItems]=React.useState<GalleryItem[]>([]);
  const [availability,setAvailability]=React.useState<PublicAvailability|null>(null);
  const [selectedWork,setSelectedWork]=React.useState<GalleryItem|null>(null);
  const [selectedMediaIndex,setSelectedMediaIndex]=React.useState(0);
  const [requestOpen,setRequestOpen]=React.useState(false);
  const [requestStep,setRequestStep]=React.useState(1);
  const [contactForm,setContactForm]=React.useState({name:'',email:'',phone:'',message:'',company:'',vehicleYear:'',vehicleMake:'',vehicleModel:'',services:[] as string[]});
  const [contactMessage,setContactMessage]=React.useState('');
  const [contactError,setContactError]=React.useState('');
  const [contactLoading,setContactLoading]=React.useState(false);

  React.useEffect(()=>{ void Promise.all([api.get('/gallery/public'),api.get('/settings/public-availability')]).then(([gallery,hours])=>{
    setItems(gallery.data?.items||[]); setAvailability(hours.data||null);
  }).catch(()=>setItems([])); },[]);

  React.useEffect(()=>{
    if(!selectedWork&&!requestOpen)return;
    const close=(event:KeyboardEvent)=>{ if(event.key==='Escape'){setSelectedWork(null);setRequestOpen(false);} };
    window.addEventListener('keydown',close); return()=>window.removeEventListener('keydown',close);
  },[requestOpen,selectedWork]);

  const hoursText=React.useMemo(()=>{
    if(!availability)return 'Monday–Friday · 8:00 AM–5:00 PM';
    const days=availability.bookableDays.map(day=>dayLabels[day]).filter(Boolean);
    const dayText=days.length===5&&availability.bookableDays.every(day=>[1,2,3,4,5].includes(day))?'Monday–Friday':days.join(', ');
    return `${dayText} · ${formatTime(availability.serviceStartTime)}–${formatTime(availability.serviceEndTime)}`;
  },[availability]);
  const primaryAction=user?.role==='admin'?{to:'/dashboard',label:'Go to dashboard',icon:LayoutDashboard}:{to:'/bookings',label:'Book an appointment',icon:Calendar};
  const PrimaryIcon=primaryAction.icon;
  const selectedMedia=selectedWork?[{mediaType:selectedWork.mediaType,mediaUrl:selectedWork.mediaUrl,thumbnailUrl:selectedWork.thumbnailUrl},...(selectedWork.additionalMedia||[])][selectedMediaIndex]:null;

  const submitContact=async(event:React.FormEvent)=>{
    event.preventDefault(); setContactError(''); setContactMessage(''); setContactLoading(true);
    const subject=contactForm.services.length?contactForm.services.join(', '):'Website service request';
    const payload={name:contactForm.name,email:contactForm.email,phone:contactForm.phone,message:contactForm.message,company:contactForm.company,subject,services:contactForm.services,vehicle:{year:contactForm.vehicleYear,make:contactForm.vehicleMake,model:contactForm.vehicleModel}};
    try { await api.post('/contact',payload); setContactForm({name:'',email:'',phone:'',message:'',company:'',vehicleYear:'',vehicleMake:'',vehicleModel:'',services:[]}); setContactMessage('Your service request has been sent.'); setRequestOpen(false); setRequestStep(1); }
    catch(error:any){ setContactError(error.response?.data?.error||'Could not send your message.'); }
    finally { setContactLoading(false); }
  };
  const toggleService=(service:string)=>setContactForm(current=>({...current,services:current.services.includes(service)?current.services.filter(item=>item!==service):[...current.services,service]}));
  const openRequest=()=>{setContactError('');setContactMessage('');setRequestStep(1);setRequestOpen(true);};

  return <div className="home-page">
    <main>
      <section className="home-hero">
        <img className="home-hero-bg" src="/terrys-hero-garage-reference.png" alt="Black performance car in Terry's workshop" />
        <div className="container home-hero-grid">
          <div>
            <div className="eyebrow">Independent auto mechanic</div>
            <h1 className="hero-title">Honest repair work<br/>for <span>everyday</span> drivers</h1>
            <p className="hero-copy">Appointment-based repair and maintenance with straight answers, practical next steps, and work the shop is willing to stand behind.</p>
            <div className="hero-hours"><Clock3 size={25}/><div><strong>Available hours</strong><span>{hoursText}</span></div></div>
            <div className="hero-actions">
              {user?<Link to={primaryAction.to} className="hero-primary"><PrimaryIcon size={18}/>{primaryAction.label}</Link>:<><button type="button" className="hero-primary" onClick={openRequest}><MessageCircle size={18}/>Request service</button><Link to="/login" className="hero-book"><Calendar size={18}/>Book appointment</Link></>}
              <a href="#work" className="hero-secondary"><Image size={18}/>View work</a>
            </div>
          </div>
          <aside className="expect-card">
            <ShieldCheck size={41}/><h2>What to expect</h2>
            <p>Service requests are reviewed before being added to the schedule, followed by practical next steps for your vehicle.</p>
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
        <div className="container"><div className="section-heading light"><p>Repair & maintenance</p><h2>Help for the problems drivers actually notice</h2><span>Start with the concern, not the technical name. The details help narrow down what the vehicle may need.</span></div>
          <div className="service-detail-grid">{detailedServices.map(({title,description,icon:Icon})=><article key={title}><div><Icon size={24}/></div><h3>{title}</h3><p>{description}</p></article>)}</div>
        </div>
      </section>

      <section className="symptom-section">
        <div className="container symptom-layout"><div><p className="section-kicker">Not sure where to start?</p><h2>You do not need to diagnose it yourself</h2><p>Explain what changed, when it started, and what you see, hear, smell, or feel while driving. Those details are useful.</p><a href="#contact">Describe the problem <MessageCircle size={17}/></a></div>
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
          <div className="about-copy"><p className="section-kicker">A direct approach to auto repair</p><h2>Work with the person reviewing your vehicle</h2><p>The shop is built around straightforward communication and practical repair decisions. Service requests are reviewed directly, with the focus kept on what the vehicle needs.</p><p>The appointment-based process gives each request a clear starting point and helps customers understand the next step before their vehicle is added to the schedule.</p><div className="about-values"><span><ShieldCheck size={19}/>Clear explanations</span><span><Wrench size={19}/>Practical repair decisions</span><span><MessageCircle size={19}/>Direct follow-up</span></div></div>
        </div>
      </section>

      <section className="faq-section home-content-section">
        <div className="container faq-layout"><div><p className="section-kicker">Before you request service</p><h2>Common questions</h2><p>Here is what to expect from the appointment-based process.</p></div><div className="faq-list">{faqs.map((faq,index)=><details key={faq.question} open={index===0}><summary>{faq.question}<ChevronDown size={19}/></summary><p>{faq.answer}</p></details>)}</div></div>
      </section>

      <section id="contact" className="request-launch-section"><div className="container"><div><p>Ready when you are</p><h2>Tell us what your vehicle needs</h2><span>Select the service, add your vehicle, and describe the concern in a few simple steps.</span>{contactMessage&&<strong>{contactMessage}</strong>}</div><button type="button" onClick={openRequest}><MessageCircle size={19}/>Start a service request</button></div></section>
    </main>

    {selectedWork&&<div className="work-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="work-title" onMouseDown={event=>{if(event.currentTarget===event.target)setSelectedWork(null);}}>
      <div className="work-modal">
        <header className="work-modal-header"><div><span>Shop work</span><strong>Terry's Auto Service</strong></div><button type="button" onClick={()=>setSelectedWork(null)} aria-label="Close work details"><X size={21}/></button></header>
        <div className="work-modal-main">
          <div className="work-media-stage">{selectedMedia?.mediaType==='video'?<video src={selectedMedia.mediaUrl} poster={selectedMedia.thumbnailUrl} controls/>:<img src={selectedMedia?.mediaUrl} alt={selectedWork.title}/>}<span className="work-media-count">{selectedMediaIndex+1} / {(selectedWork.additionalMedia?.length||0)+1}</span></div>
          <aside className="work-modal-details">
            <div><p className="work-modal-kicker">{getCategory(selectedWork.category)}</p><h2 id="work-title">{selectedWork.title}</h2><div className="work-title-rule"/><p className="work-description">{selectedWork.description||"A closer look at service work completed by Terry's Auto Service."}</p></div>
            <div className="work-detail-note"><ShieldCheck size={20}/><div><strong>Work you can count on</strong><span>Practical repairs, clear communication, and attention to the details that matter.</span></div></div>
            {user?<Link to={user.role==='admin'?`/gallery?edit=${selectedWork._id}`:primaryAction.to} className="work-modal-action">{user.role==='admin'?<Pencil size={17}/>:<Calendar size={17}/>} {user.role==='admin'?'Edit gallery entry':primaryAction.label}</Link>:<button type="button" className="work-modal-action" onClick={()=>{setSelectedWork(null);openRequest();}}><MessageCircle size={17}/>Request service</button>}
          </aside>
        </div>
        {(selectedWork.additionalMedia?.length||0)>0&&<footer className="work-thumbnail-rail"><span>More from this job</span><div>{[{mediaType:selectedWork.mediaType,mediaUrl:selectedWork.mediaUrl,thumbnailUrl:selectedWork.thumbnailUrl},...(selectedWork.additionalMedia||[])].map((media,index)=><button key={`${media.mediaUrl}-${index}`} type="button" onClick={()=>setSelectedMediaIndex(index)} className={selectedMediaIndex===index?'active':''} aria-label={`View image ${index+1}`}><img src={media.thumbnailUrl||media.mediaUrl} alt=""/></button>)}</div></footer>}
      </div>
    </div>}

    {requestOpen&&<div className="service-request-backdrop" role="dialog" aria-modal="true" aria-labelledby="request-title" onMouseDown={event=>{if(event.currentTarget===event.target)setRequestOpen(false);}}>
      <div className="service-request-modal">
        <header><div><p>Service request</p><h2 id="request-title">{requestStep===1?'Select your service':requestStep===2?'Add your vehicle':'Tell us what is happening'}</h2></div><button type="button" onClick={()=>setRequestOpen(false)} aria-label="Close service request"><X size={22}/></button></header>
        <div className="request-progress" aria-label={`Step ${requestStep} of 3`}>{[1,2,3].map(step=><div key={step} className={requestStep>=step?'active':''}><span>{requestStep>step?<CheckCircle2 size={18}/>:step}</span><strong>{step===1?'Service':step===2?'Vehicle':'Contact'}</strong></div>)}</div>

        {requestStep===1&&<section className="request-step"><div className="request-step-heading"><h3>What can we help with?</h3><p>Select any that apply. This is optional if you are not sure.</p></div><div className="request-service-grid">{requestServices.map(service=>{const selected=contactForm.services.includes(service);return <button type="button" key={service} className={selected?'selected':''} onClick={()=>toggleService(service)} aria-pressed={selected}><span>{selected?<CheckCircle2 size={20}/>:<Wrench size={20}/>}</span><strong>{service}</strong><i>{selected?'Selected':'Select'}</i></button>;})}</div></section>}

        {requestStep===2&&<section className="request-step"><div className="request-step-heading"><h3>Vehicle information</h3><p>Optional, but helpful for matching the request to the right vehicle.</p></div><div className="vehicle-fields"><label>Year <input inputMode="numeric" maxLength={4} placeholder="2018" value={contactForm.vehicleYear} onChange={event=>setContactForm({...contactForm,vehicleYear:event.target.value.replace(/\D/g,'').slice(0,4)})}/></label><label>Make <input placeholder="Toyota" value={contactForm.vehicleMake} onChange={event=>setContactForm({...contactForm,vehicleMake:event.target.value})}/></label><label>Model <input placeholder="Camry" value={contactForm.vehicleModel} onChange={event=>setContactForm({...contactForm,vehicleModel:event.target.value})}/></label></div><div className="vehicle-preview"><Car size={25}/><div><strong>{[contactForm.vehicleYear,contactForm.vehicleMake,contactForm.vehicleModel].filter(Boolean).join(' ')||'Vehicle details not added yet'}</strong><span>You can continue without completing these fields.</span></div></div></section>}

        {requestStep===3&&<form className="request-step" onSubmit={submitContact}><div className="request-step-heading"><h3>Contact and concern</h3><p>Required fields are marked with an asterisk.</p></div>{contactError&&<div className="request-error">{contactError}</div>}<input className="hidden" tabIndex={-1} autoComplete="off" value={contactForm.company} onChange={event=>setContactForm({...contactForm,company:event.target.value})}/><div className="request-contact-grid"><label>Name *<input required value={contactForm.name} onChange={event=>setContactForm({...contactForm,name:event.target.value})}/></label><label>Email *<input type="email" required value={contactForm.email} onChange={event=>setContactForm({...contactForm,email:event.target.value})}/></label><label>Phone <input type="tel" value={contactForm.phone} onChange={event=>setContactForm({...contactForm,phone:event.target.value})}/></label><label className="full">Describe the concern *<textarea rows={5} required placeholder="What are you seeing, hearing, smelling, or feeling while driving?" value={contactForm.message} onChange={event=>setContactForm({...contactForm,message:event.target.value})}/></label></div></form>}

        <footer><button type="button" className="request-back" onClick={()=>setRequestStep(step=>Math.max(1,step-1))} disabled={requestStep===1}><ArrowLeft size={17}/>Back</button><span>Step {requestStep} of 3</span>{requestStep<3?<button type="button" className="request-next" onClick={()=>setRequestStep(step=>Math.min(3,step+1))}>Continue<ArrowRight size={17}/></button>:<button type="button" className="request-next" disabled={contactLoading||!contactForm.name.trim()||!contactForm.email.trim()||!contactForm.message.trim()} onClick={()=>document.querySelector<HTMLFormElement>('.service-request-modal form')?.requestSubmit()}>{contactLoading?'Sending…':'Send request'}<ArrowRight size={17}/></button>}</footer>
      </div>
    </div>}
  </div>;
};

export default HomePage;
